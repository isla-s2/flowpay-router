import {expect, jest, test} from '@jest/globals';

import designate from './designator.js';
import db from "./models/index.js";
const Agent = db.agent;
const Ticket = db.ticket;
const Op = db.Sequelize.Op;

jest.mock('./models/index.js');

describe ("Designação de tickets aos atendentes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        [{id: 51, occupied_slots: 1, team_id: 1},{id: 52, occupied_slots: 0, team_id: 2},{id: 53, occupied_slots: 2, team_id: 3}],
        [null,{id: 52, occupied_slots: 0, team_id: 2},null],
    ])("procura um atendente livre para cada time e retorna id ao achar e null ao não achar", async (first, second, third) => {
        Agent.findOne.mockResolvedValue(null)
                     .mockResolvedValueOnce(first)
                     .mockResolvedValueOnce(second)
                     .mockResolvedValueOnce(third);

        Ticket.findAll.mockResolvedValue();

        var catch_res = await designate();
        console.log(catch_res);

        expect(Agent.findOne).toHaveBeenCalled();
        expect(catch_res).toEqual(expect.arrayContaining([[first?first.id:null, second?second.id:null, third?third.id:null]]));
    });
    
    it("procura ticket mais antigo e atualiza ele e o atendente", async ()=> {

        var ticket_arr = new Array(); 

        Agent.findOne.mockResolvedValue(null)
                     .mockResolvedValueOnce({id: 51, occupied_slots: 0, team_id: 1})
                     .mockResolvedValueOnce({id: 52, occupied_slots: 0, team_id: 2})
                     .mockResolvedValueOnce({id: 53, occupied_slots: 0, team_id: 3});

        /* Ticket.findAll.mockResolvedValue(null)
                     .mockResolvedValueOnce([{ticket_ref: 12345, subject: "Outros Assuntos", team_id: 1, cur_status: "in queue"}])
                     .mockResolvedValueOnce([{ticket_ref: 67890, subject: "Cartões", team_id: 2, cur_status: "in queue"}])
                     .mockResolvedValueOnce([{ticket_ref: 24680, subject: "Empréstimos", team_id: 3, cur_status: "in queue"}]); */
        
        Ticket.findAll.mockImplementation( async () => {
            return await Promise.resolve([]);
        }).mockImplementationOnce( async () => {
            var ticket = await Promise.resolve([{ticket_ref: 12345, subject: "Outros Assuntos", team_id: 1, cur_status: "in queue", set: jest.fn(), save: jest.fn()}]);
            ticket[0].set.mockImplementation(function (added) {
                Object.assign(this, added);
            });
            ticket[0].save.mockImplementation(() => Promise.resolve());
            ticket_arr.push(ticket[0]);
            return ticket;
        }).mockImplementationOnce( async () => {
            var ticket = await Promise.resolve([{ticket_ref: 67890, subject: "Cartões", team_id: 2, cur_status: "in queue", set: jest.fn(), save: jest.fn()}]);
            ticket[0].set.mockImplementation(function (added) {
                Object.assign(this, added);
            });
            ticket[0].save.mockImplementation(() => Promise.resolve());
            ticket_arr.push(ticket[0]);
            return ticket;
        }).mockImplementationOnce( async () => {
            var ticket = await Promise.resolve([{ticket_ref: 24680, subject: "Empréstimos", team_id: 3, cur_status: "in queue", set: jest.fn(), save: jest.fn()}]);
            ticket[0].set.mockImplementation(function (added) {
                Object.assign(this, added);
            });
            ticket[0].save.mockImplementation(() => Promise.resolve());
            ticket_arr.push(ticket[0]);
            return ticket;
        })
                            //.mockResolvedValue([{ticket_ref: 67890, subject: "Cartões", team_id: 2, cur_status: "in queue"}])
                            //.mockResolvedValue([{ticket_ref: 24680, subject: "Empréstimos", team_id: 3, cur_status: "in queue"}]);
        //aa = await findAll();
        //await console.log(ticket);

        db.sequelize.transaction.mockImplementation();

        var catch_res = await designate();
        console.log(catch_res);
        
        expect(Ticket.findAll).toHaveBeenCalledTimes(3);
        expect(db.sequelize.transaction).toHaveBeenCalledTimes(3);
        for (let t in ticket_arr){
            expect(ticket[0].set).toHaveBeenCalledTimes(1);
        }
        expect(catch_res).toEqual(expect.arrayContaining([
            expect.arrayContaining([expect.objectContaining({
                agent_id: 51,
                cur_status: "assigned"
            })]), expect.arrayContaining([expect.objectContaining({
                agent_id: 52,
                cur_status: "assigned"
            })]), expect.arrayContaining([expect.objectContaining({
                agent_id: 53,
                cur_status: "assigned"
            })]) 
        ]));
    }) 
})