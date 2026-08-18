import db from "./models/index.js";
const Ticket = db.ticket;
const Agent = db.agent;
const Op = db.Sequelize.Op;

import designate from './designator.js';

//cria um ticket
export let create = (req, res) => {
    designate();
    if (!req.body.ticket_ref || !req.body.subject) {
        res.status(400).send({message: "Conteúdo não pode estar vazio!"});
        return;
    }

    let team_assigned = 1;
    switch (true){
      case /cart[aãoõ](o|es)/gi.test(req.body.subject):
        team_assigned = 2;
        break;
      case /empr[eé]stimos?/gi.test(req.body.subject):
        team_assigned = 3;
        break;
    }
    
    return Ticket.findAndCountAll({
      where: {
        team_id: team_assigned,
        cur_status: 'in queue',
      }
    }).then(found => {
      //console.log(found.count);
      let status_assigned = 'rejected';
      let res_message = 'Erro';
      let res_status = '500';
      if (found.count <3) {
        status_assigned = 'in queue';
        res_message = 'Sucesso!';
        res_status = 201;
      }else{
        res_message = 'Tente novamente mais tarde!';
        res_status = 503;
      }

      const ticket = {
          ticket_ref: req.body.ticket_ref,
          subject: req.body.subject,
          team_id: team_assigned,
          cur_status: status_assigned
      }

      Ticket.create(ticket)
          .then(data => {
            res.status(res_status).send({data: data, message: res_message})
            designate();
          })
          .catch(err => {res.status(500).send({message: err || "Algum erro ocorreu na criação do ticket."})});

    })
    .catch(err => {res.status(500).send({message: err || "Algum erro ocorreu na verificação de dados."})});
};

//encerra o atendimento
export let close = async (req, res) => {
  const id = req.params.id;
  let return_arr = new Array();
  try{
    let ticket = await Ticket.findByPk(id);
    if (ticket.cur_status == "assigned"){
      try{
        let agent = await Agent.findByPk(ticket.agent_id)
          try{
            /* console.log("------------------");
            console.log(ticket);
            console.log("---*---")
            console.log(agent);
            console.log("------------------"); */

            ticket.set({
              cur_status: "closed"
            });
            agent.occupied_slots -= 1;
            
            /* console.log("------------------");
            console.log(ticket);
            console.log("---*---")
            console.log(agent);
            console.log("------------------"); */

            const result = await db.sequelize.transaction(async tr => {
              await ticket.save({transaction: tr});
              //console.log("ticket ok");
              await agent.save({transaction: tr});
              //console.log("agent ok");
              
              return ticket;
            })
            .then(data => {
              res.status(200).send({data: data, message: "Atendimento fechado!"})
              designate();
            });
            return_arr.push(ticket, agent);
          }catch (err) {
            res.status(500).send({
              message: err || "Algum erro ocorreu ao atualizar os dados."
            });
          }
      }catch (err) {
        res.status(500).send({
          message: "Erro tentando encontrar atendente com id=" + ticket.id
        });
      }
    }else{
      res.status(400).send({
          message: "Ticket já fechado!"
        });
    }
  }catch (err) {
    res.status(500).send({
      message: "Erro tentando encontrar ticket com id=" + id
    });
  }; 
  return return_arr;
};

//retrieves all tickets
export let findAll = (req, res) => {
    const ticket_ref = req.query.ticket_ref;
    var condition = ticket_ref ? { ticket_ref: { [Op.like]: `%${ticket_ref}%` } } : null;

    Ticket.findAll({ where: condition })
    .then(data => {
        res.send(data);
    })
    .catch(err => {
        res.status(500).send({
        message:
            err.message || "Algum erro ocorreu ao procurar os tickets."
        });
    });
};

//retrieves a ticket by id
export let findOne = (req, res) => {
  const id = req.params.id;

  Ticket.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Não foi encontrado ticket com id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Erro tentando encontrar ticket com id=" + id
      });
    });
};