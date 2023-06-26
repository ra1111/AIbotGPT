const { OpenAI } = require("langchain/llms/openai");
const { ConversationSummaryMemory } = require("langchain/memory");
const { LLMChain } = require("langchain/chains");
const { PromptTemplate } = require("langchain/prompts");
require('dotenv').config();
const functions = require('firebase-functions');
const { Configuration, OpenAIApi } = require('openai');
const Twilio = require('twilio');
const admin = require('firebase-admin');
const OPENAI_API_KEY='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' 
// Replace these with your own API keys
const openAIKey = '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';
const twilioSID = 'AC27a6598738518a7568a0400fdc488ac3';
const twilioToken = '06bef74bb015ea1a1b5b13066ef7554a';
const configuration = new Configuration({
  apiKey: openAIKey,
});
const memory = new ConversationSummaryMemory({
  memoryKey: "chat_history",
  llm: new OpenAI({ modelName: "gpt-3.5-turbo", temperature: 0.9 }),
});
const model = new OpenAI({ temperature: 0.9, openAIApiKey:process.env.OPENAI_API_KEY });
const AImessage = async (message) => {
const prompt =
    PromptTemplate.fromTemplate(`   You are OrderBot, an automated service to collect orders for a pizza restaurant. 
    You first greet the customer, then collect the order, and then ask if it's a pickup or delivery. 
    You wait to collect the entire order, then summarize it and check for a final time if the customer wants to add anything else. 
    If it's a delivery, you ask for an address. 
    Finally, you collect the payment.
    Make sure to clarify all options, extras, and sizes to uniquely identify the item from the menu.
    You respond in a short, very conversational friendly style.
    The menu includes:
    - pepperoni pizza 12.95, 10.00, 7.00
    - cheese pizza 10.95, 9.25, 6.50
    - eggplant pizza 11.95, 9.75, 6.75
    - fries 4.50, 3.50
    - greek salad 7.25
    Toppings:
    - extra cheese 2.00
    - mushrooms 1.50
    - sausage 3.00
    - canadian bacon 3.50
    - AI sauce 1.50
    - peppers 1.00
    Drinks:
    - coke 3.00, 2.00, 1.00
    - sprite 3.00, 2.00, 1.00
    - bottled water 5.00.
     The OrderBot is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

  Current conversation:
  {chat_history}
  Human: {input}
  AI:`);
  const chain = new LLMChain({ llm: model, prompt, memory });
  response= await chain.call({ input:message });
  return response.text;
}

// Set up OpenAI and Twilio clients
const openAI = new OpenAIApi(configuration);
const twilioClient = new Twilio(twilioSID, twilioToken);
admin.initializeApp();
const db = admin.database();
// const AImessage = async (message) => {
//   try {
//   const context = [
//     {
//       role: 'system',
//       content: `
//         You are OrderBot, an automated service to collect orders for a pizza restaurant. 
//         You first greet the customer, then collect the order, and then ask if it's a pickup or delivery. 
//         You wait to collect the entire order, then summarize it and check for a final time if the customer wants to add anything else. 
//         If it's a delivery, you ask for an address. 
//         Finally, you collect the payment.
//         Make sure to clarify all options, extras, and sizes to uniquely identify the item from the menu.
//         You respond in a short, very conversational friendly style.
//         The menu includes:
//         - pepperoni pizza 12.95, 10.00, 7.00
//         - cheese pizza 10.95, 9.25, 6.50
//         - eggplant pizza 11.95, 9.75, 6.75
//         - fries 4.50, 3.50
//         - greek salad 7.25
//         Toppings:
//         - extra cheese 2.00
//         - mushrooms 1.50
//         - sausage 3.00
//         - canadian bacon 3.50
//         - AI sauce 1.50
//         - peppers 1.00
//         Drinks:
//         - coke 3.00, 2.00, 1.00
//         - sprite 3.00, 2.00, 1.00
//         - bottled water 5.00
//       `,
//     },
//   ];
//   const response = await openAI.createChatCompletion({
//       model: 'gpt-3.5-turbo',
//       messages:[
//           ...context,
//         {"role": "user", content: message}
//       ]})

//     reply=response.data.choices[0].text

// context.push({ role: 'user', content: message });
// context.push({ role: 'assistant', content: reply });
//           return reply 

//   }

//   catch (error) {
//   console.error(error);
//   return 'Some error occurred. Please try again';
//   }
// }
const sendMessage = async (message, sender) => {
  try {
    await twilioClient.messages.create({
      to: sender,
      from: 'whatsapp:+14155238886',
      body: message,
    });
  } catch (error) {
    console.error(error);
  }
};

// This function is called when a user sends a message to your Twilio number
exports.onMessage = functions.https.onRequest(async (request, response) => {
  // Get the phone number of the user who sent the message
  const { Body: message, From: sender } = request.body;
  const number = sender.substring(sender.indexOf(':') + 1);
  try {
    // Get the user data from the Realtime Database using their phone number
    const userRecord = await admin.auth().getUserByPhoneNumber(number);
    const uid = userRecord.uid;
    const userDataSnapshot = await db.ref(`/AIusers/${uid}`).once('value');
    const userData = userDataSnapshot.val();
    const isSubscribed = userData.isSubscribed;
    let query = userData.query;
    const subscriptionEndDate = userData.subscriptionEndDate;

    // Check if the user has exceeded their free quota or if they have a subscription
 

        // Update the user's query count and send a response
        query += 1;
        await db.ref(`/AIusers/${uid}`).update({ query });
        const answer = await AImessage(message);
        await db.ref(`/AIusers/${uid}/use`).push({message,answer})
        return sendMessage(answer, sender);
      

  } catch (error) {
    console.error('Error fetching user data:', error);
    if (error.code === 'auth/user-not-found') {
      return sendMessage('Phone number not registered with AI Genie. Login to https://www.google.com/ to register', sender);
    }
  }
});
