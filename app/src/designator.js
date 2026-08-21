import db from "./models/index.js";
const Agent = db.agent;
const Ticket = db.ticket;
const Op = db.Sequelize.Op;

export default async() => {
    let res = new Array();
    let run = true;
    while (run){
        run = false;
        let part_res = new Array();
        for (let i=1; i <= 3; i++){
            //console.log("i: "+i);
            try{
                var agent = await Agent.findOne({where: {team_id: i, occupied_slots: {[Op.between]: [0, 2]}}});
                if (agent === null || agent === undefined) {
                    part_res[i-1] = null;
                    console.log('Agente não encontrado!');
                } else {
                    //console.log(agent);
                    part_res[i-1] = agent.id;

                    try{
                        var ticket = await Ticket.findAll({where: {team_id: i, cur_status: "in queue"}, order: [['moment', 'ASC']], limit: 1});
                        if (ticket.length < 1  || agent === undefined){
                            console.log('Ticket não encontrado!');
                        }else{

                            try{
                                /* console.log("------------------");
                                console.log(ticket);
                                console.log("------------------"); */
                                ticket[0].set({
                                    agent_id: agent.id,
                                    cur_status: "assigned"
                                });
                                agent.occupied_slots += 1;
                                /* console.log("------------------");
                                console.log(ticket[0]);
                                console.log("---*---")
                                console.log(agent);
                                console.log("------------------"); */
                                
                                const result = await db.sequelize.transaction(async tr => {
                                    await ticket[0].save({transaction: tr});
                                    await agent.save({transaction: tr});

                                    return [ticket[0], agent];
                                });
                                run = true;
                                res.push([ticket[0], agent]);
                            }catch (err) {console.log(err || "Algum erro ocorreu ao atualizar os dados.")}
                        }
                    }catch (err) {console.log(err || "Algum erro ocorreu na verificação de tickets.")}
                }
            }catch (err) {console.log(err || "Algum erro ocorreu na verificação de atendentes.")}
        }
        if (!part_res.every(e => e === null)) res.push(part_res);
    }
    return res;
}