var moment = require('moment');
var queue = require('queue');
var promise = require('q');
var schedule = require('node-schedule');
const tf = require('@tensorflow/tfjs-node');

//Recurrence rules
var updateRule = new schedule.RecurrenceRule();
updateRule.second = new schedule.Range(0, 59, 1);

var formatData={};
var neuralNetwork;
var predictions;
var loss=0;
var scheduleJob;

module.exports = {
    initialization: function(rawData, minLoss) {
        formatData.x = [];
        formatData.y = [];
        neuralNetwork = createNN();
    
        for(var i=0;i<rawData.length;i++){ 
            var category = rawData[i].category/40;
    
            if(category > 1) category = 1;
            if(category < 0) category = 0;     
    
            formatData.y.push(1);
            formatData.x.push( [category,category] );
        }
    
        scheduleJob = schedule.scheduleJob(updateRule, function() {
            keepTraining(minLoss);
        });
    },

    predict: function(rawData){
        if(predictions != undefined)
            predictions.dispose;
        predictions = Array.from(Predictions(rawData).dataSync());
        return predictions;
    }

}

var updating=false;
function keepTraining(minLoss){
    if(!updating){
        updating=true;
        Training()
        .then(function(res){
            loss = res;
            if(loss < minLoss){
                scheduleJob.cancel();
            }
            updating=false;
        });
    }
}

//create NN structure
function createNN(){
    const model = tf.sequential({
    name: 'nn',
    layers: [
        // Neural network with one hidden layer
        tf.layers.dense({units: 20, activation: 'relu', inputShape: [2]}),
        tf.layers.dense({units: 40, activation: 'relu'}),
        tf.layers.dense({units: 60, activation: 'relu'}),
        tf.layers.dense({units: 30, activation: 'relu'}),
        tf.layers.dense({units: 1, activation:'sigmoid'})
    ]
    });
        model.compile(
        {loss: 'binaryCrossentropy', optimizer: tf.train.adagrad(0.1)}
    );
    return model;
}

//training function
async function Training(){
    if (formatData.x.length == 0 || formatData.y.length == 0) return null;
    
    const TRAIN_BATCHES = 1;
    const BATCH_SIZE = 100;  
  
    var tfX = tf.tensor2d(formatData.x);
    var tfY = tf.tensor1d(formatData.y);
    var loss;
    for (let i = 0; i < TRAIN_BATCHES; i++) {
        const history = await neuralNetwork.fit(
            tfX,
            tfY,
            {batchSize: BATCH_SIZE, epochs: 1}
        );
        loss = history.history.loss[0];
      
    }
    return loss;
}

//prediction function
function Predictions(rawData){
    var formatTestData = [];
    for(var i=0;i<rawData.length;i++){ 
        var category = rawData[i].category/40;

        if(category > 1) category = 1;
        if(category < 0) category = 0;   

        formatTestData.push( [category,category] );
    }
  
    var tfT = tf.tensor2d(formatTestData);
  
    const predictions = tf.tidy(() => 
        neuralNetwork.model.predict(tfT)
    );
    return predictions;
}

//util function
function map(x,in_min,in_max,out_min,out_max){
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}