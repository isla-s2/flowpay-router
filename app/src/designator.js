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
            console.log("i: "+i);
            var agent = await Agent.findOne({where: {team_id: i, occupied_slots: {[Op.between]: [0, 2]}}})
            .catch(err => {console.log(err || "Algum erro ocorreu na verificação de atendentes.");});
            if (agent === null) {
                part_res[i-1] = null;
                console.log('Not found!');
            } else {
                console.log(agent);
                part_res[i-1] = agent.id;
                console.log(agent);

                var ticket = await Ticket.findAll({where: {team_id: i, cur_status: "in queue"}, order: [['moment', 'ASC']], limit: 1})
                .catch(err => {console.log(err || "Algum erro ocorreu na verificação de tickets.")});
                if ( ticket == undefined || ticket.length < 1 ){
                    console.log('Not foundddddd!');
                }else{
                    run = true;
                    console.log("------------------");
                    console.log(ticket);
                    console.log("---------owo---------");
                    ticket[0].set({
                        agent_id: agent.id,
                        cur_status: "assigned"
                    });
                    agent.occupied_slots += 1;
                    console.log("------------------");
                    console.log(ticket[0]);
                    console.log("---*---")
                    console.log(agent);
                    console.log("---------uwu---------");

                    try{
                        const result = await db.sequelize.transaction(async tr => {
                            await ticket[0].save({transaction: tr});
                            await agent.save({transaction: tr});

                            return [ticket[0], agent];
                        });
                        res.push([ticket[0], agent]);
                    }catch (err) {console.log(err || "Algum erro ocorreu na verificação de tickets.")}
                }
            }
        }
        if (!part_res.every(e => e === null)) res.push(part_res);
    }
    return res;
}