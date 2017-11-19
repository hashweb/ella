.PHONY: docker-build docker-create

docker-build:
	docker build --tag ella:latest .

docker-create:
	docker create --tty --interactive \
    --name ella \
    --hostname ella \
    --volume ${PWD}:/ella \
    --publish 9229:9229 \
    ella

docker-sandbox: docker-build docker-create
