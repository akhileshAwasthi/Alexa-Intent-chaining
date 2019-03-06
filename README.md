# Alexa-Intent-chaining
This Sample Provide a sample code on how to implement recenlty released Intent Chaining Feature for the Alexa Skill.

Intent chaining allows your skill code to start dialog management from any intent, including the LaunchRequest. You can chain into any of your custom intents as long as your interaction model has a dialog model.

In this sample of Corner Cafe, I have tried to implement the Intent Chainingis the simplest possible terms. 

When user comes to the skill he is asked about what he wants. for simplicity, the user can current ask for hot/cold coffee in different sizes. The OrderCoffeeIntent handles this intent and has two slots for size and coffee type.

Dialog management is used for the fulfilment of the slots. When these slot are filled then the control is shifted to another intent called "AskForSnacksIntent", Which is to determmine if user wants one of the snacks available with the coffee.

The AskForSnacksIntent has a slot for the snackType which is required to fulfill the intent, hence this results in skill asking user if he/she wants some snack.


I have used addDelegateDirective to achieve Intent-Chaning : 
```
return responseBuilder
      .speak(say) // delegate to Alexa to collect all the required slots for next Intent
      .addDelegateDirective({
        name: 'AskForSnacksIntent',
        confirmationStatus: 'NONE',
        slots: {}
      })
      .reprompt("Reprompt")
      .getResponse();
```
