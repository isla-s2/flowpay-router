import {expect, jest} from '@jest/globals';

import * as tickets from "./ticket_controller.js";
import db from "./models/index.js";
const Ticket = db.ticket;
const Agent = db.agent;

jest.mock('./models/index.js');

describe("Criação de tickets", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        [12345, "Cartões"],
        [67890, "Empréstimos"],
        [24680, "Outros Assuntos"],
    ])("cria novo ticket, envia pra fila e retorna mensagem de sucesso", async (ticket_ref, subject)=>{
        const req = {
            body: {
                ticket_ref: ticket_ref,
                subject: subject
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Ticket.findAndCountAll.mockReturnValue(Promise.resolve({
            count: 1
        }));

        Ticket.create.mockImplementation(() => Promise.resolve());

        await tickets.create(req, res);

        expect(Ticket.create).toHaveBeenCalledTimes(1);
        expect(Ticket.create).toHaveBeenCalledWith(expect.objectContaining({
            ticket_ref: expect.any(Number),
            subject: expect.any(String),
            team_id: expect.any(Number),
            cur_status: "in queue"
        }));
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: "Sucesso!"
        }));
    });

    it.each([
        [12345, "Cartões"],
        [67890, "Empréstimos"],
        [24680, "Outros Assuntos"],
    ])("cria novo ticket, rejeita e retorna mensagem de rejeição", async (ticket_ref, subject)=>{
        const req = {
            body: {
                ticket_ref: ticket_ref,
                subject: subject
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Ticket.findAndCountAll.mockReturnValue(Promise.resolve({
            count: 3
        }));

        Ticket.create.mockImplementation(() => Promise.resolve());

        await tickets.create(req, res);

        expect(Ticket.create).toHaveBeenCalledTimes(1);
        expect(Ticket.create).toHaveBeenCalledWith(expect.objectContaining({
            ticket_ref: expect.any(Number),
            subject: expect.any(String),
            team_id: expect.any(Number),
            cur_status: "rejected"
        }));
        
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: "Tente novamente mais tarde!"
        }));
    });

    it.each([
        [null, "Cartões"],
        [67890, null],
        [24680, ""],
    ])("retorna erro 400 e não cria o ticket caso algum campo esteja vazio", async (ticket_ref, subject)=>{
        const req = {
            body: {
                ticket_ref: ticket_ref,
                subject: subject
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Ticket.findAndCountAll.mockReturnValue(Promise.resolve({
            count: 1
        }));

        Ticket.create.mockImplementation(() => Promise.resolve());

        await tickets.create(req, res);

        expect(Ticket.create).toHaveBeenCalledTimes(0);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: "Conteúdo não pode estar vazio!"
        }));
    });

    it.each([
        [12345, "Cartões"],
        [67890, "Empréstimos"],
        [24680, "Outros Assuntos"],
    ])("ticket_ref e subject tem os mesmos valores que os enviados", async (ticket_ref, subject)=>{
        const req = {
            body: {
                ticket_ref: ticket_ref,
                subject: subject
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Ticket.findAndCountAll.mockReturnValue(Promise.resolve({
            count: 1
        }));

        Ticket.create.mockImplementation(() => Promise.resolve());

        await tickets.create(req, res);

        expect(Ticket.create).toHaveBeenCalledTimes(1);
        expect(Ticket.create).toHaveBeenCalledWith(expect.objectContaining({
            ticket_ref: ticket_ref,
            subject: subject
        }));
    });

    it.each([
        [12345, "Cartões"],
        [12345, "cartoes"],
        [12345, "Cartão"],
        [12345, "cartao"],
        [67890, "Empréstimos"],
        [67890, "emprestimos"],
        [67890, "Empréstimo"],
        [67890, "emprestimo"],
        [24680, "Outros Assuntos"],
        [24680, "abcdefg"],
    ])("designa o team_id correto", async (ticket_ref, subject)=>{
        const req = {
            body: {
                ticket_ref: ticket_ref,
                subject: subject
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Ticket.findAndCountAll.mockReturnValue(Promise.resolve({
            count: 1
        }));

        Ticket.create.mockImplementation(() => Promise.resolve());

        await tickets.create(req, res);

        expect(Ticket.create).toHaveBeenCalledTimes(1);

        var expected_id = 1;
        switch (true){
        case /cart[aãoõ](o|es)/gi.test(req.body.subject):
            expected_id = 2;
            break;
        case /empr[eé]stimos?/gi.test(req.body.subject):
            expected_id = 3;
            break;
        }

        expect(Ticket.create).toHaveBeenCalledWith(expect.objectContaining({
            team_id: expected_id
        }));
    });
});

describe("Fechamento de tickets", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("procura o ticket a ser fechado pela PK e seu agente", async () => {
        const req = {
            params: {
                id: 101
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        
        Ticket.findByPk.mockResolvedValueOnce({id: 101, ticket_ref: 12345, subject: "Outros Assuntos", team_id: 1, cur_status: "assigned", agent_id:51});
        Agent.findByPk.mockResolvedValueOnce({id: 51, occupied_slots: 1, team_id: 1});

        let result = await tickets.close(req,res);
        //console.log(result);

        expect(Ticket.findByPk).toHaveBeenCalledTimes(2);
    });

    it("atualiza o ticket e o atendente", async () => {
        const req = {
            params: {
                id: 101
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        
        Ticket.findByPk.mockImplementationOnce( async () => {
            var ticket = await Promise.resolve({id: 101, ticket_ref: 12345, subject: "Outros Assuntos", team_id: 1, cur_status: "assigned", agent_id:51, set: jest.fn(), save: jest.fn()});
            //console.log(ticket);
            ticket.set.mockImplementation(function (added) {
                Object.assign(this, added);
            });
            ticket.save.mockImplementation(() => Promise.resolve());
            return ticket;
        });
        Agent.findByPk.mockResolvedValueOnce({id: 51, occupied_slots: 1, team_id: 1, set: jest.fn(), save: jest.fn()});
        
        let result = await tickets.close(req,res);
        //console.log(result);

        expect(db.sequelize.transaction).toHaveBeenCalledTimes(1);
        
        expect(ticket.set).toHaveBeenCalledTimes(1);
            
        expect(result).toEqual(expect.arrayContaining([
            expect.objectContaining({
                cur_status: "closed"
            }),expect.objectContaining({
                occupied_slots: 0
            })
        ]));
    })
});