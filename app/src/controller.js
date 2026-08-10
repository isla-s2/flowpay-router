import db from "./models/index.js";
const Ticket = db.ticket;
const Op = db.Sequelize.Op;

//creates a ticket
export let create = (req, res) => {
    if (!req.body.ticket_ref) {
        res.status(400).send({message: "Conteúdo não pode estar vazio!"});
        return;
    }

    const ticket = {
        ticket_ref: req.body.ticket_ref,
        subject: req.body.subject,
        cur_status: req.body.cur_status
    }

    Ticket.create(ticket)
        .then(data => {res.send(data)})
        .catch(err => {res.status(500).send({message: err || "Algum erro ocorreu na criação do ticket."})});
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