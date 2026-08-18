import db from "./models/index.js";
const Agent = db.agent;
const Op = db.Sequelize.Op;

//retrieves all agents
export let findAll = (req, res) => {
    //const ticket_ref = req.query.ticket_ref;
    //var condition = ticket_ref ? { ticket_ref: { [Op.like]: `%${ticket_ref}%` } } : null;

    Agent.findAll(/* { where: condition } */)
    .then(data => {
        res.send(data);
    })
    .catch(err => {
        res.status(500).send({
        message:
            err.message || "Algum erro ocorreu ao procurar os atendentes."
        });
    });
};

//retrieves an agent by id
export let findOne = (req, res) => {
  const id = req.params.id;

  Agent.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Não foi encontrado atendente com id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Erro tentando encontrar atendente com id=" + id
      });
    });
};