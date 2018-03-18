//cargo el módulo sequelize
const Sequelize = require('sequelize');
//genero una instancia de sequelize para acceder a una base de datos
const sequelize = new Sequelize("sqlite:quizzes.sqlite", {logging: false});
//genero un modelo de datos (con preg y respuesta)
sequelize.define('quiz', {
	question: { //unicas y no vacias
		type: Sequelize.STRING,
		unique: {msg: "Ya existe esta pregunta"},
		validate: {notEmpty: {msg:"La pregunta no puede estar vacia"}}
	},
	answer: { //no vacias
		type: Sequelize.STRING,
		validate: {notEmpty: {msg: "La respuesta no puede estar vacia"}}
	}
});

//sincronizacion: miro si en la base de datros estan las tablas que necesito
sequelize.sync()
.then(() => sequelize.models.quiz.count()) //promesa
.then(count => {
	//si esta vacio creamos unas preg. por defecto
	if(!count) {
		return sequelize.models.quiz.bulkCreate([ //el return es para que la promesa del then espere a que esto termine
				{ question: "¿capital de Italia?", answer: "Roma" },
				{ question: "¿capital de Francia?", answer: "Paris" },
				{ question: "¿capital de España?", answer: "Madrid" },
				{ question: "¿capital de Portugal?", answer: "Lisboa" }
			]);
	}
})
.catch(error => {
	console.log(error);
}),
//exporto sequelize
module.exports = sequelize;
