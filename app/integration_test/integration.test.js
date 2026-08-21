import {expect, jest, test} from '@jest/globals';

import { app } from "../app.js";
import db from "../src/models/index.js";
const Agent = db.agent;
const Ticket = db.ticket;
const Op = db.Sequelize.Op;
const designate = jest.requireActual('../src/designator.js');

import supertest from "supertest";

//jest.setTimeout(0);

describe("Criação de Tickets", () => {
    beforeEach(async () => {
        await jest.restoreAllMocks();
        await db.sequelize.sync()
            .then(async () => {
                console.log("Synced test database");
                const result = await db.sequelize.transaction(async tr => {
                    await Ticket.truncate({transaction: tr});
                    await Agent.update({ occupied_slots: 0 },{where: {occupied_slots: {[Op.gt]: 0},}});
                });
            })
            .catch((err) => {console.log("Failed to sync test database: " + err);});
    });

    it.each([
        [12345, "Cartões", 2],
        [67890, "Empréstimos", 3],
        [24680, "Outros Assuntos", 1],
    ])("Cria ticket com sucesso", async (ticket_ref, subject, team_id) => {
        jest.spyOn(Ticket, 'create');
        jest.spyOn(designate, 'default');

        let response = await supertest(app).post('/api/ticket/create').send({"ticket_ref": ticket_ref, "subject": subject});
        console.log(response.body);
        
        expect(Ticket.create).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(201);
        expect(response.body).toEqual(expect.objectContaining({"message": "Sucesso!"}));
        //expect(designate.default).toHaveBeenCalledTimes(2);

        let confirm = await supertest(app).get(`/api/ticket/${response.body.data.id}`);
        console.log(confirm.body);

        expect(confirm.status).toBe(200);
        expect(confirm.body).toEqual(expect.objectContaining({"ticket_ref": ticket_ref, "subject": subject, "team_id": team_id}));
    });

    it("Retorna 400 e não cria ticket em caso de erro no body", async () => {
        let spyCreate = jest.spyOn(Ticket, 'create');

        let response = await supertest(app).post('/api/ticket/create').send({"ticket_ref": "abcde", "subject": "outros"});
        console.log(response.body);

        expect(response.status).toBe(400);
        expect(Ticket.create).toHaveBeenCalledTimes(0);
        //expect(designate.default).toHaveBeenCalledTimes(2);
    });

    it("Retorna 500 e não cria ticket em caso de erro ao procurar tickets", async () => {
        let spyCreate = jest.spyOn(Ticket, 'create');
        
        let spyFind = jest.spyOn(Ticket, 'findAndCountAll').mockRejectedValue("Algum erro ocorreu na verificação de dados.");

        let response = await supertest(app).post('/api/ticket/create').send({"ticket_ref": 12345, "subject": "outros"});
        console.log(response.body);
        expect(response.body).toEqual({"message": "Algum erro ocorreu na verificação de dados."});

        expect(response.status).toBe(500);
        expect(Ticket.create).toHaveBeenCalledTimes(0);
        //expect(designate.default).toHaveBeenCalledTimes(2);
    });

    it("Retorna 500 em caso de erro ao criar ticket", async () => {
        let spyCreate = jest.spyOn(Ticket, 'create').mockImplementation(() => {
            throw new Error();
        });

        let response = await supertest(app).post('/api/ticket/create').send({"ticket_ref": 12345, "subject": "outros"});
        console.log(response.body);

        expect(response.status).toBe(500);
        expect(Ticket.create).not.toHaveReturned();
        //expect(designate.default).toHaveBeenCalledTimes(2);
    });

    it("Retorna 503 e rejeita o ticket caso a fila esteja cheia", async () => {
        let spyFind = jest.spyOn(Ticket, 'findAndCountAll').mockResolvedValue({
            count: 3
        });
        let spyCreate = jest.spyOn(Ticket, 'create');

        let response = await supertest(app).post('/api/ticket/create').send({"ticket_ref": 24680, "subject": "outros"});
        console.log(response.body);

        expect(response.status).toBe(503);
        expect(Ticket.create).toHaveBeenCalledTimes(1);
        //expect(designate.default).toHaveBeenCalledTimes(2);

        let confirm = await supertest(app).get(`/api/ticket/${response.body.data.id}`);
        expect(confirm.status).toBe(200);
        expect(confirm.body).toEqual(expect.objectContaining({"ticket_ref": 24680, "cur_status": "rejected"}));
        
    });
});

describe("Designação de Tickets", () => {
    beforeEach(async () => {
        await jest.restoreAllMocks();
        await db.sequelize.sync()
            .then(async () => {
                console.log("Synced test database");
                const result = await db.sequelize.transaction(async tr => {
                    await Ticket.truncate({transaction: tr});
                    await Agent.update({ occupied_slots: 0 },{where: {occupied_slots: {[Op.gt]: 0},}});
                });
            })
            .catch((err) => {console.log("Failed to sync test database: " + err);});
    });

    it("Designa um ticket a um atendente do mesmo time se houver um disponível", async () =>{
        let ticket = {
            ticket_ref: 201,
            subject: "Cartões",
            team_id: 2,
            cur_status: "in queue"
        }
        let created_tk = await Ticket.create(ticket);
            /* .then(data => {console.log({data: data, message: "ticket criado"})})
            .catch(console.log({message:  "Algum erro ocorreu na criação do ticket."})); */

        console.log(created_tk);
        await designate.default();

        let confirm_tk = await supertest(app).get(`/api/ticket/${created_tk.id}`);
        expect(confirm_tk.status).toBe(200);
        expect(confirm_tk.body).toEqual(expect.objectContaining({"ticket_ref": 201, "team_id": 2, "cur_status": "assigned", "agent_id": 4}));
        
        let confirm_ag = await supertest(app).get(`/api/agent/4`);
        expect(confirm_ag.body).toEqual(expect.objectContaining({"occupied_slots": 1}));
    });

    it("Designa vários tickets para o mesmo time", async () =>{
        let ticket1 = {
            ticket_ref: 201,
            subject: "Cartões",
            team_id: 2,
            cur_status: "in queue"
        }
        let ticket2 = {
            ticket_ref: 202,
            subject: "Cartões",
            team_id: 2,
            cur_status: "in queue"
        }
        let ticket3 = {
            ticket_ref: 203,
            subject: "Cartões",
            team_id: 2,
            cur_status: "in queue"
        }
        let created_tk1 = await Ticket.create(ticket1);
        let created_tk2 = await Ticket.create(ticket2);
        let created_tk3 = await Ticket.create(ticket3);
            /* .then(data => {console.log({data: data, message: "ticket criado"})})
            .catch(console.log({message:  "Algum erro ocorreu na criação do ticket."})); */

        await designate.default();

        let confirm_tk = await supertest(app).get(`/api/ticket`);
        expect(confirm_tk.body).toEqual([
            expect.objectContaining({"ticket_ref": 201, "team_id": 2, "cur_status": "assigned", "agent_id": 4}),
            expect.objectContaining({"ticket_ref": 202, "team_id": 2, "cur_status": "assigned", "agent_id": 4}),
            expect.objectContaining({"ticket_ref": 203, "team_id": 2, "cur_status": "assigned", "agent_id": 4})
        ]);
        
        let confirm_ag = await supertest(app).get(`/api/agent/4`);
        expect(confirm_ag.body).toEqual(expect.objectContaining({"occupied_slots": 3}));
    })
});

describe("Fechamento de Tickets", () => {
    beforeEach(async () => {
        await jest.restoreAllMocks();
        await db.sequelize.sync()
            .then(async () => {
                console.log("Synced test database");
                const result = await db.sequelize.transaction(async tr => {
                    await Ticket.truncate({transaction: tr});
                    await Agent.update({ occupied_slots: 0 },{where: {occupied_slots: {[Op.gt]: 0},}});
                });
            })
            .catch((err) => {console.log("Failed to sync test database: " + err);});
    });

    it("Fecha o ticket e atualiza o atendente designado", async () => {
        let ticket = {
            ticket_ref: 201,
            subject: "Cartões",
            team_id: 2, 
            agent_id: 4,
            cur_status: "assigned"
        }
        let created_tk = await Ticket.create(ticket);
        await Agent.update({ occupied_slots: 1 },{where: {id: 4}});

        let response = await supertest(app).patch(`/api/ticket/close/${created_tk.id}`);
        console.log(response.body);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({"message": "Atendimento fechado!"}));
        //expect(designate.default).toHaveBeenCalledTimes(2);

        let confirm = await supertest(app).get(`/api/ticket/${response.body.data.id}`);
        console.log(confirm.body);
        expect(confirm.body).toEqual(expect.objectContaining({"cur_status": "closed"}));

        let confirm_ag = await supertest(app).get(`/api/agent/4`);
        expect(confirm_ag.body).toEqual(expect.objectContaining({"occupied_slots": 0}));
    });

    it("Retorna 400 ao tentar fechar ticket já fechado, e não atualza o atendente", async () => {
        let ticket = {
            ticket_ref: 201,
            subject: "Cartões",
            team_id: 2, 
            agent_id: 4,
            cur_status: "closed"
        }
        let created_tk = await Ticket.create(ticket);
        await Agent.update({ occupied_slots: 1 },{where: {id: 4}});

        let response = await supertest(app).patch(`/api/ticket/close/${created_tk.id}`);
        console.log(response.body);
        
        expect(response.status).toBe(400);
        expect(response.body).toEqual(expect.objectContaining({"message": "Ticket já fechado!"}));
        //expect(designate.default).toHaveBeenCalledTimes(2);

        let confirm_ag = await supertest(app).get(`/api/agent/4`);
        expect(confirm_ag.body).toEqual(expect.objectContaining({"occupied_slots": 1}));
    });

    it("Retorna 500 em caso de erro ao procurar ticket", async () => {
        let response = await supertest(app).patch(`/api/ticket/close/123`);
        console.log(response.body);

        expect(response.status).toBe(500);
        expect(response.body).toEqual(expect.objectContaining({"message": "Erro tentando encontrar ticket com id=123"}));
        //expect(designate.default).toHaveBeenCalledTimes(2);
    });

    it("Retorna 500 em caso de erro ao procurar atendente", async () => {
        let ticket = {
            ticket_ref: 201,
            subject: "Cartões",
            team_id: 2, 
            agent_id: 4,
            cur_status: "assigned"
        }
        let created_tk = await Ticket.create(ticket);
        
        let spyFind = jest.spyOn(Agent, 'findByPk').mockImplementation(() => {
            throw new Error();
        });

        let response = await supertest(app).patch(`/api/ticket/close/${created_tk.id}`);
        console.log(response.body);

        expect(response.status).toBe(500);
        expect(response.body).toEqual(expect.objectContaining({"message": "Erro tentando encontrar atendente com id=4"}));
        //expect(designate.default).toHaveBeenCalledTimes(2);
    });

    it("Retorna 500 em caso de erro ao atualizar dados", async () => {
        let ticket = {
            ticket_ref: 201,
            subject: "Cartões",
            team_id: 2, 
            agent_id: 4,
            cur_status: "assigned"
        }
        let created_tk = await Ticket.create(ticket);
        await Agent.update({ occupied_slots: 1 },{where: {id: 4}});
        
        let spyCreate = jest.spyOn(db.sequelize, 'transaction').mockRejectedValue("Algum erro ocorreu ao atualizar os dados.");

        let response = await supertest(app).patch(`/api/ticket/close/${created_tk.id}`);
        console.log(response.body);
        
        expect(response.status).toBe(500);
        expect(response.body).toEqual({"message": "Algum erro ocorreu ao atualizar os dados."});
        //expect(designate.default).toHaveBeenCalledTimes(2);
    });
})