.PHONY: docker-build docker-create

docker-build:
	docker build --tag ella:latest .

docker-create:
	docker create --tty --interactive \
    --name ella \
    --hostname ella \
    --volume ${PWD}:/ella \
    ella

docker-sandbox: docker-build docker-create
