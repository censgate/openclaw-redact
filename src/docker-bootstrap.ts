import { spawn } from "node:child_process";
import type { HttpBackendConfig } from "./types.js";

export interface BackendBootstrapper {
  ensureRunning(
    httpConfig: HttpBackendConfig,
    options?: { restartIfRunning?: boolean },
  ): Promise<{ endpoint: string }>;
}

export class DockerBackendBootstrapper implements BackendBootstrapper {
  async ensureRunning(
    httpConfig: HttpBackendConfig,
    options?: { restartIfRunning?: boolean },
  ): Promise<{ endpoint: string }> {
    const dockerConfig = httpConfig.docker;
    if (!dockerConfig?.enabled) {
      return { endpoint: httpConfig.endpoint };
    }

    await this.assertDockerInstalled();

    if (dockerConfig.pull) {
      await runDockerCommand(["pull", dockerConfig.image]);
    }

    const isRunning = await this.isContainerRunning(dockerConfig.containerName);
    if (isRunning) {
      if (options?.restartIfRunning) {
        await runDockerCommand(["restart", dockerConfig.containerName]);
      }
      return {
        endpoint: await this.resolveEndpoint(httpConfig),
      };
    }

    const exists = await this.containerExists(dockerConfig.containerName);
    if (exists) {
      await runDockerCommand(["start", dockerConfig.containerName]);
      return {
        endpoint: await this.resolveEndpoint(httpConfig),
      };
    }

    const portBinding = dockerConfig.hostPort
      ? `${dockerConfig.host}:${dockerConfig.hostPort}:${dockerConfig.containerPort}`
      : `${dockerConfig.host}::${dockerConfig.containerPort}`;

    await runDockerCommand([
      "run",
      "-d",
      "--name",
      dockerConfig.containerName,
      "-p",
      portBinding,
      dockerConfig.image,
    ]);

    return {
      endpoint: await this.resolveEndpoint(httpConfig),
    };
  }

  private async assertDockerInstalled(): Promise<void> {
    await runDockerCommand(["version"], "Docker is required for auto-start.");
  }

  private async isContainerRunning(containerName: string): Promise<boolean> {
    const result = await runDockerCommand([
      "ps",
      "--filter",
      `name=^/${containerName}$`,
      "--filter",
      "status=running",
      "--format",
      "{{.ID}}",
    ]);
    return result.trim().length > 0;
  }

  private async containerExists(containerName: string): Promise<boolean> {
    const result = await runDockerCommand([
      "ps",
      "-a",
      "--filter",
      `name=^/${containerName}$`,
      "--format",
      "{{.ID}}",
    ]);
    return result.trim().length > 0;
  }

  private async resolveEndpoint(httpConfig: HttpBackendConfig): Promise<string> {
    const dockerConfig = httpConfig.docker;
    if (!dockerConfig?.enabled) {
      return httpConfig.endpoint;
    }

    const result = await runDockerCommand([
      "port",
      dockerConfig.containerName,
      `${dockerConfig.containerPort}/tcp`,
    ]);

    const hostPort = parseMappedPort(result);
    const sourceUrl = new URL(httpConfig.endpoint);
    const endpoint = new URL(sourceUrl.toString());
    endpoint.hostname = dockerConfig.host;
    endpoint.port = String(hostPort);
    endpoint.pathname = "";
    endpoint.search = "";
    endpoint.hash = "";
    return endpoint.toString().replace(/\/$/, "");
  }
}

function parseMappedPort(output: string): number {
  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(/:(\d+)\s*$/);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }

  throw new Error(`Unable to resolve mapped docker port from output: ${output}`);
}

async function runDockerCommand(
  args: string[],
  customErrorPrefix?: string,
): Promise<string> {
  const { code, stdout, stderr } = await runProcess("docker", args);
  if (code !== 0) {
    const prefix = customErrorPrefix ?? "Docker command failed.";
    throw new Error(`${prefix} docker ${args.join(" ")} :: ${stderr || stdout}`);
  }
  return stdout;
}

function runProcess(
  command: string,
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}
