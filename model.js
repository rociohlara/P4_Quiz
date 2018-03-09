
const fs = require ("fs");
const DB_FILENAME = "quizzers.json";



//modelo de datos
//esta variable se mantiene todos los quizzers existentes
//es un array de objetos, donde cada objet tiene los atributos questio
//y answer para guardar el texto de la pregunta y el de la respuesta
let quizzers =[
{
	question: "Capital de Italia",
	answer: "Roma"
},
{
	question: "Capital de Francia",
	answer: "París"
},
{
	question: "Capital de España",
	answer: "Madrid"
},
{
	question: "Capital de Portugal",
	answer: "Lisboa"
}
];

//funciones para tratar wl fichero

const load = () => {
	fs.readFile(DB_FILENAME, (error, data) => {
		    if (error){
	             //la primera vez no existe el fichero
	             if(error.code === 'ENOENT'){
	             	save();
	             	return;
	             }
	             throw error;
		    }
	    let json = JSON.parse(data);
	    if (json) {
	    	quizzers = json;
	    }
		});
};

const save = () => {
	fs.writeFile(DB_FILENAME,
		JSON.stringify(quizzers),
		error => {
			if (error){
			 throw error;
			}
		});
};






//metodos:

//1.count: devuelve el numero de preguntas existentes
exports.count =() => quizzers.length;

//2.add: añade un nuevo quizz
exports.add =(question, answer) => {
	quizzers.push({
         question: (question || "").trim(),
         answer: (answer || "").trim(),
	});
	save();
};

//3.update: actualiza el quiz situado en la posicion index
exports.update = (id, question, answer) => {
	const quiz = quizzers [id];
	if (typeof quiz ==="undefined"){
		throw new Error (`El valor del parametro id no es valido.`)
	}
	quizzers.splice(id, 1,{
		question: (question || "").trim(),
        answer: (answer || "").trim()
	});
	save();
};

//4.getAll: devuelve todos los quiz existentes (una clonacion)
exports.getAll = () => JSON.parse(JSON.stringify(quizzers));

//5.getByIndex: devuelve un clon del quiz almacenado en la posicion dada
exports.getByIndex = id => {
    const quiz = quizzers [id];
    if (typeof quiz === "undefined") {
    	throw new Error (`El valor del parametro id no es valido`);
    }
    return JSON.parse(JSON.stringify(quiz));
};

//6.deleteByIndex: elimina el quiz situado en la posicion dada
exports.deleteByIndex = id => {
    const quiz = quizzers [id];
    if (typeof quiz === "undefined") {
    	throw new Error (`El valor del parametro id no es valido`);
    }
    quizzers.splice(id, 1);
    save();
};

load();