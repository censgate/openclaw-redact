.PHONY: clean help

help:
	@echo "Targets:"
	@echo "  clean                - Remove dist/ and npm pack tarballs"

clean:
	rm -rf dist
	rm -f *.tgz
