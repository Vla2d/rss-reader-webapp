lint:
	npx eslint .
install:
	npm install
serve:
	npx webpack serve
build:
	npm run build
fix:
	npx eslint . --fix
test:
	npm test