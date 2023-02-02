const fs = require('fs');
const test = './tests/test.json';

function makeid(length) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}


let inform = {"time":[],"component":"","threadID":"","stimulus":{"clazz":"","messageID":"","performative":"","sender":"","recipient":""},"response":{"clazz":"","messageID":"","performative":"","recipient":""}};
let agree = {"time":[],"component":"","threadID":"","stimulus":{"clazz":"","messageID":"","performative":"","sender":"","recipient":""},"response":{"clazz":"","messageID":"","performative":"","recipient":""}};
let txnotif = {"time":[],"component":"","threadID":"","stimulus":{"clazz":"","messageID":"","performative":"","sender":"","recipient":""},"response":{"clazz":"","messageID":"","performative":"","sender":"","recipient":""}};
let rxnotif = {"time":[],"component":"","threadID":"","stimulus":{"clazz":"","messageID":"","performative":"","sender":"","recipient":""},"response":{"clazz":"","messageID":"","performative":"","sender":"","recipient":""}};
const half = () => {
    let file = fs.readFileSync(test);
    let obj = JSON.parse(file);
    const events = obj.events[0].events;
    const length = events.length;
    var i;
    var j;
    for(i = 0; i <= length; i++ ){
        if (events[i].response.clazz.includes('TxFrame')){          
            for(j = i; j <= length; j++){
                if (events[j].stimulus.clazz.includes('RxFrame')){
                    let sender = events[i];
                    let receive = events[j];
                    inform.time = sender.time + 3; 
                    inform.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length -1);
                    inform.threadID = sender.response.messageID ;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    inform.stimulus.clazz = "org.arl.unet.phy.TxFrameReq";
                    inform.stimulus.messageID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    inform.stimulus.performative = "REQUEST";
                    inform.stimulus.sender = sender.stimulus.recipient;
                    inform.stimulus.recipient = "phy";
                    inform.response.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    inform.response.messageID = makeid(8) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(11);//9913082f-0891-40be-8b8a-c62cf68063ae
                    inform.response.performative = "INFORM";
                    inform.response.recipient = "phy";
                    agree.time = sender.time + 6; 
                    agree.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length -1);
                    agree.threadID = sender.response.messageID ;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    agree.stimulus.clazz = "org.arl.unet.phy.TxFrameReq";
                    agree.stimulus.messageID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    agree.stimulus.performative = "REQUEST";
                    agree.stimulus.sender = sender.stimulus.recipient;
                    agree.stimulus.recipient = "phy";
                    agree.response.clazz = "org.arl.fjage.Message";
                    agree.response.messageID = inform.response.messageID;//9913082f-0891-40be-8b8a-c62cf68063ae
                    agree.response.performative = "AGREE";
                    agree.response.recipient = "phy";
                    rxnotif.time = sender.time + 12; 
                    rxnotif.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + receive.component.substr(receive.component.length -1);
                    rxnotif.threadID = inform.response.messageID ;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    rxnotif.stimulus.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    rxnotif.stimulus.messageID = inform.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    rxnotif.stimulus.performative = "INFORM";
                    rxnotif.stimulus.sender = "phy";
                    rxnotif.stimulus.recipient = "phy";
                    rxnotif.response.clazz = "org.arl.unet.phy.RxFrameNtf";
                    rxnotif.response.messageID = receive.threadID ;//12995b36-b42d-4277-bd2d-9936ee4a2d29
                    rxnotif.response.performative = "INFORM";
                    rxnotif.response.sender = "phy";
                    rxnotif.response.recipient = "#phy__ntf";                        
                    txnotif.time = sender.time + 9; 
                    txnotif.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length -1);
                    txnotif.threadID = sender.response.messageID ;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    txnotif.stimulus.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    txnotif.stimulus.messageID = inform.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    txnotif.stimulus.performative = "INFORM";
                    txnotif.stimulus.sender = "phy";
                    txnotif.stimulus.recipient = "phy";
                    txnotif.response.clazz = "org.arl.unet.phy.TxFrameNtf";
                    txnotif.response.messageID = makeid(8) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(11) ;//c26d1081-48fd-4afe-af0d-426e5e6c7d21
                    txnotif.response.performative = "INFORM";
                    txnotif.response.sender = "phy";
                    txnotif.response.recipient = sender.stimulus.recipient;
                    events.splice(i+1,0,inform,agree,txnotif,rxnotif);                      
                    break;
                }
            }
        }
    }
    obj.events[0].events = events;
    fs.writeFileSync('./trial.json', JSON.stringify(obj,null,4));
    console.log(obj);
}
half();
