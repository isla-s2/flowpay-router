# API Router FlowPay

## Objetivo
Montar uma API que gerencia atendimentos de uma empresa (FlowPay), recebendo solicitações de atendimento (tickets) e distribuindo elas entre atendentes separados em times. A empresa conta com 3 times: "Cartões", "Empréstimos" e "Outros Assuntos", cada um com 3 funcionários. Cada funcionário pode atender até 3 chamados simultaneamente, e cada time conta com uma fila de espera de até 3 chamados. Para tanto, a API foi pensada com endpoints para criação de solicitações e encerramento de atendimentos e uma função que atribui solicitações a atendentes disponíveis.

## Desenvolvimento
### Linguagens e ferramentas

- Node.js
    - Express
    - Sequelize
    - Jest
    - SuperTest
- Docker
- MySQL
- GitHub Actions

### Pontos básicos do processo de desenvolvimento
- Endpoint `/create` para criar solicitações, as coloca na fila de espera;
- Endpoint `/close` para fechar atendimentos ativos;
- Função `designate()` chamada em ambos os endpoints para procurar atendentes disponíveis e designar chamados a eles.
- Desenvolvimento com Docker Compose
- Testes unitários e integrados

## Utilização

Pré-requisitos: Git e Docker instalados

```Bash
git clone https://github.com/isla-s2/flowpay-router.git
cd flowpay-router
```

Crie um arquivo .env usando .env.example

```
docker compose up
```

### Endpoints

#### Criação de solicitações

POST `/api/ticket/create` :
```
{
    "ticket_ref": 1234
    "subject": "Cartões"
}
```

#### Fechamento de atendimentos

PATCH `/api/ticket/close/{id}`

#### Endpoints GET extras

`/api/ticket` : Mostra todos os chamados

`/api/ticket/{id}` : Procura chamado por id

`/api/agent` : Mostra todos os atendentes

`/api/agent/{id}` : Procura atendente por id

## Aprendizado

Quando comecei o projeto, tinha apenas conhecimento de JavaScript, majoritariamente no Front-end, e SQL um pouco enferrujado. Nunca havia montado uma API, usado Docker ou Git ou criado testes antes, então foi uma ótima oportunidade de adquirir bastante conhecimento novo botando a mão na massa!