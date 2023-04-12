# First Kafka Project

Este repositório contém um exemplo de implementação de microsserviços utilizando Kafka para comunicação entre eles. O projeto consiste em três microsserviços:

1. Kafka Service: Responsável por produzir e consumir mensagens do tópico save-file no Kafka.
2. Files Service: Responsável por salvar e recuperar arquivos utilizando o Kafka para comunicação.
3. Register Service: Atua como um gateway, recebendo requisições HTTP e interagindo com os outros microsserviços através do Kafka.

## Requisitos

- Node.js 18.x ou superior
- Docker e Docker Compose

## Instruções de instalação

1. Clone o repositório:
```
git clone git@github.com:thadeucbr/first-kafka-project.git
cd first-kafka-project
```
2. Construa e inicie todos os serviços (Kafka, Zookeeper e microsserviços) usando Docker Compose:
```
docker-compose up
```
Agora, todos os microsserviços estão em execução no Docker, e o Kafka e o Zookeeper estão sendo executados como serviços separados. Não é necessário executar npm install ou iniciar os microsserviços individualmente, pois o Docker Compose cuida disso.

## Uso
Os microsserviços estão configurados para se comunicar entre si através do Kafka. Você pode interagir com o sistema usando o Register Service, que expõe duas rotas:

1. <b>POST /user</b>: Cria um novo usuário e retorna um ID gerado.
Exemplo de requisição:
```
curl -X POST -H "Content-Type: application/json" -d '{"name": "John Doe", "email": "john.doe@example.com"}' http://localhost:3001/user
```
Exemplo de resposta:
```
{
  "id": "b27c1d7e-751a-4d14-8863-1a2784f82b1e"
}
```
2. <b>GET /user/:id</b>: Retorna informações sobre o usuário com o ID especificado.
Exemplo de requisição:
```
curl http://localhost:3001/user/b27c1d7e-751a-4d14-8863-1a2784f82b1e
```
Exemplo de resposta:
```
{
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```