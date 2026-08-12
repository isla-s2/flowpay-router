import {expect, jest} from '@jest/globals';

import * as tickets from "./ticket_controller.js";
import db from "./models/index.js";
const Ticket = db.ticket;

jest.mock('./models/index.js');

describe("Criação de tickets", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Ticket.create = jest.fn().mockResolvedValue(Ticket);
    
    //jest.unstable_mockModule('./models/index.js', () => ({
    //  ticket: mockTicket
    //}))

    //const tickets = import("./ticket_controller.js");
    //const db = import("./models/index.js");

    it("cria novo ticket, envia pra fila e retorna mensagem de sucesso", async ()=>{
        const req = {
            body: {
                ticket_ref: 123456,
                subject: "Cartões"
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

    it("cria novo ticket, rejeita e retorna mensagem de rejeição", async ()=>{
        const req = {
            body: {
                ticket_ref: 123456,
                subject: "Cartões"
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

    it("retorna erro 400 e não cria o ticket caso algum campo esteja vazio", async ()=>{
        const req = {
            body: {
                ticket_ref: 123456
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

    it("ticket_ref e subject tem os mesmos valores que os enviados", async ()=>{
        const req = {
            body: {
                ticket_ref: 123456,
                subject: "Cartões"
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
            ticket_ref: 123456,
            subject: "Cartões"
        }));
    });

    it("designa o team_id correto", async ()=>{
        const req = {
            body: {
                ticket_ref: 123456,
                subject: "Cartões"
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

        expected_id = 1;
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