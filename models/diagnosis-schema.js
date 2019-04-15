var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var DiagnosisSchema   = new Schema({
	Marca: String,	
	idUnidade: Number,
	Unidade: String,	
	dataExame: { type: Date, default: null },	
	numAtendimento:	Number,
	idProntuario: Number,
	Idade: Number,
	Sexo: String,
	idEspecialidade: Number,
	Especialidade: String,
	idExame: Number,
	Exame: String,
	dataLaudo: { type: Date, default: null },
	resultadoHtml: String,
	resultadoTxt: [String],
	tokenList: [[String]],
	vtokenList: [Number],
	symptomList: [[String]],
	resultList: [[String]]
   
});

module.exports = mongoose.model('diagnosis', DiagnosisSchema);

/*    --------_Example Data ---------
[ "RESSONÂNCIA MAGNÉTICA DO JOELHO ESQUERDO",
"Sequências sagital, coronal e axial \"FSE\" T2,com saturação de gordura", "Sequência coronal \"FSE\" ponderada em T1",
"Sequência coronal oblíqua \"FSE\" ponderada em DP",
"Sequência axial \"FSE\" T2 com saturação de gordura com técnica para a patela",
"Edema/contusão medular na região anterior do platô tibial lateral",
"Demais estrutura óssea com forma e intensidades de sinal preservados",
"Inserção tópica da patela, tipo III na classificação de Wiberg e sulco troclear com boa profundidade",
"Meniscos medial e lateral com forma e intensidade de sinal preservados", 
"Rotura parcial do ligamento cruzado anterior, caracterizado por afilamento e elevação do sinal em T2 nas fibras remanescentes",
"Ligamentos cruzado posterior, colaterais patelar preservados",
"Tendões do quadríceps e poplíteo preservados", 
"Mínimo borramento da gordura suprapatelar medial, caracterizado por hipersinal em T2", 
"Quantidade fisiológica de líquido intra-articular", 
"Fossa poplítea normal",
"Retináculos patelares preservados", 
"Cartilagem hialina da patela e da tróclea femoral preservado", 
"Sinais de estiramento/rotura parcial antiga na junção miotendínea do semimembranoso, caracterizado por espessamento e irregularidade do contorno e hipossinal em todas sequências", 
"Edema/contusão medular na região anterior do platô tibial lateral", 
"Rotura parcial do ligamento cruzado anterior", 
"Sinais de estiramento/rotura parcial antiga na junção miotendínea do semimembranoso", 
"" ]

[ "RESSONÂNCIA MAGNÉTICA DO JOELHO ESQUERDO",
 "Sequências sagital, coronal e axial \"FSE\" T2, com saturação de gordura",
 "Sequência coronal \"FSE\" ponderada em T1", 
 "Sequência coronal oblíqua \"FSE\" ponderada em DP", 
 "Sequência axial \"FSE\" T2 com saturação de gordura com técnica para a patela", 
 "Edema/contusão medular na região anterior do platô tibial lateral", 
 "Demais estrutura óssea com forma e intensidades de sinal preservados", 
 "Inserção tópica da patela, tipo III na classificação de Wiberg e sulco troclear com boa profundidade", 
 "Meniscos medial e lateral com forma e intensidade de sinal preservados", 
 "Rotura parcial do ligamento cruzado anterior, caracterizado por afilamento e elevação do sinal em T2 nas fibras remanescentes", 
 "Ligamentos cruzado posterior, colaterais e patelar preservados", 
 "Tendões do quadríceps e poplíteo preservados", 
 "Mínimo borramento da gordura suprapatelar medial, caracterizado por hipersinal em T2", 
 "Quantidade fisiológica de líquido intra-articular", 
 "Fossa poplítea normal", 
 "Retináculos patelares preservados", 
 "Cartilagem hialina da patela e da tróclea femoral preservadas", 
 "Sinais de estiramento/rotura parcial antiga na junção miotendínea do semimembranoso, caracterizado por espessamento, irregularidade do contorno e hipossinal em todas sequências", 
 "Edema/contusão medular na região anterior do platô tibial lateral", "Rotura parcial do ligamento cruzado anterior", 
 "Sinais de estiramento/rotura parcial antiga na junção miotendínea distal do semimembranoso", 
 "" ]
*/
