// Lambda Function code for Alexa.
// Paste this into your index.js file. 

const Alexa = require("ask-sdk");
const https = require("https");



const invocationName = "corner cafe";

// Session Attributes 
//   Alexa will track attributes for you, by default only during the lifespan of your session.
//   The history[] array will track previous request(s), used for contextual Help/Yes/No handling.
//   Set up DynamoDB persistence to have the skill save and reload these attributes between skill sessions.

function getMemoryAttributes() {
  const memoryAttributes = {
    "history": [],


    "launchCount": 0,
    "lastUseTimestamp": 0,

    "lastSpeechOutput": {},
    // "nextIntent":[]

    // "favoriteColor":"",
    // "name":"",
    // "namePronounce":"",
    // "email":"",
    // "mobileNumber":"",
    // "city":"",
    // "state":"",
    // "postcode":"",
    // "birthday":"",
    // "bookmark":0,
    // "wishlist":[],
  };
  return memoryAttributes;
};

const maxHistorySize = 20; // remember only latest 20 intents 


// 1. Intent Handlers =============================================

const AMAZON_CancelIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


    let say = 'Okay, talk to you later! ';

    return responseBuilder
      .speak(say)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const AMAZON_HelpIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let history = sessionAttributes['history'];
    let intents = getCustomIntents();
    let sampleIntent = randomElement(intents);

    let say = 'You asked for help. ';

    let previousIntent = getPreviousIntent(sessionAttributes);
    if (previousIntent && !handlerInput.requestEnvelope.session.new) {
      say += 'Your last intent was ' + previousIntent + '. ';
    }
    
    say += ' Here something you can ask me, ' + getSampleUtterance(sampleIntent);

    return responseBuilder
      .speak(say)
      .reprompt('try again, ' + say)
      .getResponse();
  },
};

const AMAZON_StopIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


    let say = 'Okay, talk to you later! ';

    return responseBuilder
      .speak(say)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const AMAZON_NavigateHomeIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NavigateHomeIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let say = 'Hello from AMAZON.NavigateHomeIntent. ';


    return responseBuilder
      .speak(say)
      .reprompt('try again, ' + say)
      .getResponse();
  },
};

const OrderCoffeeIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'OrderCoffeeIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // delegate to Alexa to collect all the required slots 
    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();

    }
    let say = 'Okay !';

    let slotStatus = '';
    let resolvedSlot;

    let slotValues = getSlotValues(request.intent.slots);
    // getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

    // console.log('***** slotValues: ' +  JSON.stringify(slotValues, null, 2));
    //   SLOT: sizeSlot 

    if (slotValues.sizeSlot.ERstatus === 'ER_SUCCESS_MATCH') {

      let size = slotValues.sizeSlot.resolved
      sessionAttributes['CoffeeSize'] = size

    } else if ((slotValues.sizeSlot.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.sizeSlot.heardAs)) {

      return responseBuilder
        .speak("We have small, medium and large sizes to offer, Which One do you want?")
        .reprompt("What would you like with you coffee?")
        .getResponse();

    }
    //   SLOT: typeSlot 
    if (slotValues.typeSlot.ERstatus === 'ER_SUCCESS_MATCH') {

      let type = slotValues.typeSlot.resolved
      sessionAttributes['CoffeeType'] = type

    } else if ((slotValues.typeSlot.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.typeSlot.heardAs)) {

      /*  */
      return responseBuilder
        .speak("We have Hot and Cold coffee to offer, Which One would you Like?")
        .reprompt("We have Hot and Cold coffee to offer, Which One would you Like?")
        .getResponse();

    }

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return responseBuilder
      .speak(say) // delegate to Alexa to collect all the required slots for next Intent
      .addDelegateDirective({
        name: 'AskForSnacksIntent',
        confirmationStatus: 'NONE',
        slots: {}
      })
      .reprompt("What would you like with you coffee?")
      .getResponse();
  },
};

const AskForSnacksIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AskForSnacksIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // delegate to Alexa to collect all the required slots 
    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();

    }
    let say = '';

    let slotStatus = '';
    let resolvedSlot;

    let slotValues = getSlotValues(request.intent.slots);
    // getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

    // console.log('***** slotValues: ' +  JSON.stringify(slotValues, null, 2));
    //   SLOT: snackSlot 

    if (slotValues.snackSlot.ERstatus === 'ER_SUCCESS_MATCH') {

      let snack = slotValues.snackSlot.resolved
      let size = sessionAttributes['CoffeeSize']
      let type = sessionAttributes['CoffeeType']

      if (snack === "nothing") {
        say = `Okay, No Problem. Your ${size} ${type} coffee will be delivered to you soon. Thanks for using Corner Cafe.`
      } else {
        say = `great. Your ${size} ${type} coffee with ${snack} will be delivered to you soon. Thanks for using Corner Cafe.`

      }
      return responseBuilder
        .speak(say)
        .getResponse();
    }

    if ((slotValues.snackSlot.ERstatus === 'ER_SUCCESS_NO_MATCH') || (!slotValues.snackSlot.heardAs)) {
      say = " Sorry, we only have chips, sandwitch and french fries with us. What would you like?"
      return responseBuilder
        .speak(say)
        .reprompt("Plese let me know what would you like with your coffee?")
        .getResponse();
    }





  },
};

const LaunchRequest_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;

    let say = 'hello' + ' and welcome to ' + invocationName + ' ! How can I help You today ?.';

    let skillTitle = capitalize(invocationName);


    return responseBuilder
      .speak(say)
      .reprompt(say)
      .withStandardCard('Welcome!',
        'Hello!\nThis is a card for your skill, ' + skillTitle,
        welcomeCardImg.smallImageUrl, welcomeCardImg.largeImageUrl)
      .getResponse();
  },
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const request = handlerInput.requestEnvelope.request;

    console.log(`Error handled: ${error.message}`);
    // console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);

    return handlerInput.responseBuilder
      .speak(`Sorry, your skill got this error.  ${error.message} `)
      .reprompt(`Sorry, your skill got this error.  ${error.message} `)
      .getResponse();
  }
};


// 2. Constants ===========================================================================

// Here you can define static data, to be used elsewhere in your code.  For example: 
//    const myString = "Hello World";
//    const myArray  = [ "orange", "grape", "strawberry" ];
//    const myObject = { "city": "Boston",  "state":"Massachusetts" };

const APP_ID = undefined; // TODO replace with your Skill ID (OPTIONAL).

// 3.  Helper Functions ===================================================================

function capitalize(myString) {

  return myString.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
}


function randomElement(myArray) {
  return (myArray[Math.floor(Math.random() * myArray.length)]);
}

function stripSpeak(str) {
  return (str.replace('<speak>', '').replace('</speak>', ''));
}




function getSlotValues(filledSlots) {
  const slotValues = {};

  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;

    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case 'ER_SUCCESS_MATCH':
          slotValues[name] = {
            heardAs: filledSlots[item].value,
            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            ERstatus: 'ER_SUCCESS_MATCH'
          };
          break;
        case 'ER_SUCCESS_NO_MATCH':
          slotValues[name] = {
            heardAs: filledSlots[item].value,
            resolved: '',
            ERstatus: 'ER_SUCCESS_NO_MATCH'
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        heardAs: filledSlots[item].value || '', // may be null 
        resolved: '',
        ERstatus: ''
      };
    }
  }, this);

  return slotValues;
}

function getExampleSlotValues(intentName, slotName) {

  let examples = [];
  let slotType = '';
  let slotValuesFull = [];

  let intents = model.interactionModel.languageModel.intents;
  for (let i = 0; i < intents.length; i++) {
    if (intents[i].name == intentName) {
      let slots = intents[i].slots;
      for (let j = 0; j < slots.length; j++) {
        if (slots[j].name === slotName) {
          slotType = slots[j].type;

        }
      }
    }

  }
  let types = model.interactionModel.languageModel.types;
  for (let i = 0; i < types.length; i++) {
    if (types[i].name === slotType) {
      slotValuesFull = types[i].values;
    }
  }

  slotValuesFull = shuffleArray(slotValuesFull);

  examples.push(slotValuesFull[0].name.value);
  examples.push(slotValuesFull[1].name.value);
  if (slotValuesFull.length > 2) {
    examples.push(slotValuesFull[2].name.value);
  }


  return examples;
}

function sayArray(myData, penultimateWord = 'and') {
  let result = '';

  myData.forEach(function (element, index, arr) {

    if (index === 0) {
      result = element;
    } else if (index === myData.length - 1) {
      result += ` ${penultimateWord} ${element}`;
    } else {
      result += `, ${element}`;
    }
  });
  return result;
}

function supportsDisplay(handlerInput) // returns true if the skill is running on a device with a display (Echo Show, Echo Spot, etc.) 
{ //  Enable your skill for display as shown here: https://alexa.design/enabledisplay 
  const hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;

  return hasDisplay;
}


const welcomeCardImg = {
  smallImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane720_480.png",
  largeImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane1200_800.png"


};

const DisplayImg1 = {
  title: 'Jet Plane',
  url: 'https://s3.amazonaws.com/skill-images-789/display/plane340_340.png'
};
const DisplayImg2 = {
  title: 'Starry Sky',
  url: 'https://s3.amazonaws.com/skill-images-789/display/background1024_600.png'

};

function getCustomIntents() {
  const modelIntents = model.interactionModel.languageModel.intents;

  let customIntents = [];


  for (let i = 0; i < modelIntents.length; i++) {

    if (modelIntents[i].name.substring(0, 7) != "AMAZON." && modelIntents[i].name !== "LaunchRequest") {
      customIntents.push(modelIntents[i]);
    }
  }
  return customIntents;
}

function getSampleUtterance(intent) {

  return randomElement(intent.samples);

}

function getPreviousIntent(attrs) {

  if (attrs.history && attrs.history.length > 1) {
    return attrs.history[attrs.history.length - 2].IntentRequest;

  } else {
    return false;
  }

}

function getPreviousSpeechOutput(attrs) {

  if (attrs.lastSpeechOutput && attrs.history.length > 1) {
    return attrs.lastSpeechOutput;

  } else {
    return false;
  }

}

function timeDelta(t1, t2) {

  const dt1 = new Date(t1);
  const dt2 = new Date(t2);
  const timeSpanMS = dt2.getTime() - dt1.getTime();
  const span = {
    "timeSpanMIN": Math.floor(timeSpanMS / (1000 * 60)),
    "timeSpanHR": Math.floor(timeSpanMS / (1000 * 60 * 60)),
    "timeSpanDAY": Math.floor(timeSpanMS / (1000 * 60 * 60 * 24)),
    "timeSpanDesc": ""
  };


  if (span.timeSpanHR < 2) {
    span.timeSpanDesc = span.timeSpanMIN + " minutes";
  } else if (span.timeSpanDAY < 2) {
    span.timeSpanDesc = span.timeSpanHR + " hours";
  } else {
    span.timeSpanDesc = span.timeSpanDAY + " days";
  }


  return span;

}


const InitMemoryAttributesInterceptor = {
  process(handlerInput) {
    let sessionAttributes = {};
    if (handlerInput.requestEnvelope.session['new']) {

      sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      let memoryAttributes = getMemoryAttributes();

      if (Object.keys(sessionAttributes).length === 0) {

        Object.keys(memoryAttributes).forEach(function (key) { // initialize all attributes from global list 

          sessionAttributes[key] = memoryAttributes[key];

        });

      }
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);


    }
  }
};

const RequestHistoryInterceptor = {
  process(handlerInput) {

    const thisRequest = handlerInput.requestEnvelope.request;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let history = sessionAttributes['history'] || [];

    let IntentRequest = {};
    if (thisRequest.type === 'IntentRequest') {

      let slots = [];

      IntentRequest = {
        'IntentRequest': thisRequest.intent.name
      };

      if (thisRequest.intent.slots) {

        for (let slot in thisRequest.intent.slots) {
          let slotObj = {};
          slotObj[slot] = thisRequest.intent.slots[slot].value;
          slots.push(slotObj);
        }

        IntentRequest = {
          'IntentRequest': thisRequest.intent.name,
          'slots': slots
        };

      }

    } else {
      IntentRequest = {
        'IntentRequest': thisRequest.type
      };
    }
    if (history.length > maxHistorySize - 1) {
      history.shift();
    }
    history.push(IntentRequest);

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  }

};




const RequestPersistenceInterceptor = {
  process(handlerInput) {

    if (handlerInput.requestEnvelope.session['new']) {

      return new Promise((resolve, reject) => {

        handlerInput.attributesManager.getPersistentAttributes()

          .then((sessionAttributes) => {
            sessionAttributes = sessionAttributes || {};


            sessionAttributes['launchCount'] += 1;

            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

            handlerInput.attributesManager.savePersistentAttributes()
              .then(() => {
                resolve();
              })
              .catch((err) => {
                reject(err);
              });
          });

      });

    } // end session['new'] 
  }
};


const ResponseRecordSpeechOutputInterceptor = {
  process(handlerInput, responseOutput) {

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let lastSpeechOutput = {
      "outputSpeech": responseOutput.outputSpeech.ssml,
      "reprompt": responseOutput.reprompt.outputSpeech.ssml
    };

    sessionAttributes['lastSpeechOutput'] = lastSpeechOutput;

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  }
};

const ResponsePersistenceInterceptor = {
  process(handlerInput, responseOutput) {

    const ses = (typeof responseOutput.shouldEndSession == "undefined" ? true : responseOutput.shouldEndSession);

    if (ses || handlerInput.requestEnvelope.request.type == 'SessionEndedRequest') { // skill was stopped or timed out 

      let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      sessionAttributes['lastUseTimestamp'] = new Date(handlerInput.requestEnvelope.request.timestamp).getTime();

      handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);

      return new Promise((resolve, reject) => {
        handlerInput.attributesManager.savePersistentAttributes()
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });

      });

    }

  }
};


function shuffleArray(array) { // Fisher Yates shuffle! 

  let currentIndex = array.length,
    temporaryValue, randomIndex;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    AMAZON_CancelIntent_Handler,
    AMAZON_HelpIntent_Handler,
    AMAZON_StopIntent_Handler,
    AMAZON_NavigateHomeIntent_Handler,
    OrderCoffeeIntent_Handler,
    AskForSnacksIntent_Handler,
    LaunchRequest_Handler,
    SessionEndedHandler
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(InitMemoryAttributesInterceptor)
  .addRequestInterceptors(RequestHistoryInterceptor)

  // .addResponseInterceptors(ResponseRecordSpeechOutputInterceptor)

  // .addRequestInterceptors(RequestPersistenceInterceptor)
  // .addResponseInterceptors(ResponsePersistenceInterceptor)

  // .withTableName("askMemorySkillTable")
  // .withAutoCreateTable(true)

  .lambda();


// End of Skill code -------------------------------------------------------------
// Static Language Model for reference

const model = {
  "interactionModel": {
    "languageModel": {
      "invocationName": "corner cafe",
      "intents": [{
          "name": "AMAZON.CancelIntent",
          "samples": []
        },
        {
          "name": "AMAZON.HelpIntent",
          "samples": []
        },
        {
          "name": "AMAZON.StopIntent",
          "samples": []
        },
        {
          "name": "AMAZON.NavigateHomeIntent",
          "samples": []
        },
        {
          "name": "OrderCoffeeIntent",
          "slots": [{
              "name": "sizeSlot",
              "type": "Size",
              "samples": [
                "i want {sizeSlot}",
                "{sizeSlot}"
              ]
            },
            {
              "name": "typeSlot",
              "type": "Type",
              "samples": [
                "{typeSlot}",
                "i want {typeSlot} coffee"
              ]
            }
          ],
          "samples": [
            "i want to order coffee",
            "i want to order a {sizeSlot} {typeSlot} coffee"
          ]
        },
        {
          "name": "AskForSnacksIntent",
          "slots": [{
            "name": "snackSlot",
            "type": "snackType",
            "samples": [
              "{snackSlot}"
            ]
          }],
          "samples": [
            "i want to order {snackSlot}",
            "{snackSlot}",
            "i want {snackSlot}"
          ]
        },
        {
          "name": "LaunchRequest"
        }
      ],
      "types": [{
          "name": "Type",
          "values": [{
              "name": {
                "value": "cold",
                "synonyms": [
                  "cooler"
                ]
              }
            },
            {
              "name": {
                "value": "hot",
                "synonyms": [
                  "warmer",
                  "warm"
                ]
              }
            }
          ]
        },
        {
          "name": "Size",
          "values": [{
              "name": {
                "value": "medium"
              }
            },
            {
              "name": {
                "value": "large"
              }
            },
            {
              "name": {
                "value": "small"
              }
            }
          ]
        },
        {
          "name": "snackType",
          "values": [{
              "name": {
                "value": "nothing"
              }
            },
            {
              "name": {
                "value": "sandwitch"
              }
            },
            {
              "name": {
                "value": "chips"
              }
            },
            {
              "name": {
                "value": "french fries"
              }
            }
          ]
        }
      ]
    },
    "dialog": {
      "intents": [{
          "name": "OrderCoffeeIntent",
          "confirmationRequired": false,
          "prompts": {},
          "slots": [{
              "name": "sizeSlot",
              "type": "Size",
              "confirmationRequired": false,
              "elicitationRequired": true,
              "prompts": {
                "elicitation": "Elicit.Slot.795955237563.1107372602195"
              }
            },
            {
              "name": "typeSlot",
              "type": "Type",
              "confirmationRequired": false,
              "elicitationRequired": true,
              "prompts": {
                "elicitation": "Elicit.Slot.795955237563.462890550748"
              }
            }
          ]
        },
        {
          "name": "AskForSnacksIntent",
          "confirmationRequired": false,
          "prompts": {},
          "slots": [{
            "name": "snackSlot",
            "type": "snackType",
            "confirmationRequired": false,
            "elicitationRequired": true,
            "prompts": {
              "elicitation": "Elicit.Slot.114526204777.544519169091"
            }
          }]
        }
      ],
      "delegationStrategy": "ALWAYS"
    },
    "prompts": [{
        "id": "Elicit.Slot.795955237563.1107372602195",
        "variations": [{
            "type": "PlainText",
            "value": "in what size do you want your {typeSlot} to be ?"
          },
          {
            "type": "PlainText",
            "value": "small, large or medium ?"
          },
          {
            "type": "PlainText",
            "value": "what size?"
          },
          {
            "type": "PlainText",
            "value": "What Size are you looking for?"
          }
        ]
      },
      {
        "id": "Elicit.Slot.795955237563.462890550748",
        "variations": [{
            "type": "PlainText",
            "value": "{sizeSlot} coffe, how do you want it ?"
          },
          {
            "type": "PlainText",
            "value": "hot or cold?"
          },
          {
            "type": "PlainText",
            "value": "how do you want it, hot or cold?"
          }
        ]
      },
      {
        "id": "Elicit.Slot.114526204777.544519169091",
        "variations": [{
            "type": "PlainText",
            "value": "What do want with it, sandwitch, chips or french fries ?"
          },
          {
            "type": "PlainText",
            "value": "What do want with it ?"
          }
        ]
      }
    ]
  }
};