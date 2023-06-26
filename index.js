

// const functions = require('firebase-functions');
// const { Configuration, OpenAIApi } = require('openai');
// const Twilio = require('twilio');
// const admin = require('firebase-admin');

// // Replace these with your own API keys
// const openAIKey = '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';
// const twilioSID = 'AC27a6598738518a7568a0400fdc488ac3';
// const twilioToken = '06bef74bb015ea1a1b5b13066ef7554a';
// const configuration = new Configuration({
//   apiKey: openAIKey,
// });

// // Set up OpenAI and Twilio clients
// const openAI = new OpenAIApi(configuration);
// const twilioClient = new Twilio(twilioSID, twilioToken);
// admin.initializeApp();
// const db = admin.database();

// const AImessage =async(message)=>{
//  await openAI.createCompletion({
//       prompt: message,
//       model: "text-davinci-003",
//       max_tokens: 2048
//     }).then(result => {
//       const responseMessage = result.data.choices[0].text
//       return(responseMessage)
//     }).catch(()=>{
//       return("Some error occured. Please try again")
//     })
// }
// const sendMessage= async(message)=>{
//   twilioClient.messages
// .create({
// to: sender,
// from: 'whatsapp:+14155238886',
// body: responseMessage
// })
// .then(() => response.send(responseMessage))
// }

// // This function is called when a user sends a message to your Twilio number
// exports.onMessage = functions.https.onRequest(async (request, response) => {
//   // Get the phone number of the user who sent the message
//   const from = request.query.from;
//   const { Body: message, From: sender } = request.body;

//   try {
//     // Get the user data from the Realtime Database using their phone number
//     const userRecord = await admin.auth().getUserByPhoneNumber(`+${from}`);
//     const uid = userRecord.uid;
//     const userData = await db.ref(`/AIusers/${uid}`).once('value');
//     const isSubscribed = userData.val().isSubscribed;
    
//     let query = userData.val().query;

//     // Check if the user has exceeded their free quota or if they have a subscription
//     if (!isSubscribed ) {
//       if(query>5)
//       {
//        sendMessage('Free quota exceeded, kindly login to https://www.google.com/ and select a subscription plan');
//     } 
//     else if (query < 6) {
//       // Update the user's query count and send a response
//       query += 1;
//       await db.ref(`/AIusers/${uid}`).update({ query });
//     const answer=await AImessage(message)

//     }
//   }else{
//     const today = new Date();
//     const subscriptionEndDate = userData.subscriptionEndDate;
//     if (today.getTime() > subscriptionEndDate.getTime()) {
//        sendMessage('Your subscription has expired. Please renew your subscription at https://www.google.com/');
//     } else {
//       // Update the user's query count and send a response
//       query += 1;
//       await db.ref(`/AIusers/${uid}`).update({ query });
//        sendMessage(query);
//     }

//   }
   
//   } catch (error) {
//     console.error('Error fetching user data:', error);
//     if (error.code === 'auth/user-not-found') {
//       sendMessage('Phone number not registered with AI Genie. Login to https://www.google.com/ to register');
//     }
//   }
// });

const functions = require('firebase-functions');
const { Configuration, OpenAIApi } = require('openai');
const Twilio = require('twilio');
const admin = require('firebase-admin');

// Replace these with your own API keys
const openAIKey = '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';
const twilioSID = 'AC27a6598738518a7568a0400fdc488ac3';
const twilioToken = '06bef74bb015ea1a1b5b13066ef7554a';
const configuration = new Configuration({
  apiKey: openAIKey,
});

// Set up OpenAI and Twilio clients
const openAI = new OpenAIApi(configuration);
const twilioClient = new Twilio(twilioSID, twilioToken);
admin.initializeApp();
const db = admin.database();

// const AImessage = async (message) => {
//   try {
//     const result = await openAI.createCompletion({
//       prompt: message,
//       model: 'text-davinci-003',
//       max_tokens: 2048,
//     });
//     return result.data.choices[0].text;
//   } catch (error) {
//     console.error(error);
//     return 'Some error occurred. Please try again';
//   }
// };
const AImessage = async (message) => {
  try {
  const context = [
    {
      role: 'system',
      content: `
        You are OrderBot, an automated service to collect orders for a pizza restaurant. 
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
        - bottled water 5.00
      `,
    },
  ];
  const response = await openAI.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages:[
          ...context,
        {"role": "user", content: message}
      ]})

    reply=response.data.choices[0].text

context.push({ role: 'user', content: message });
context.push({ role: 'assistant', content: reply });
          return reply 

  }

  catch (error) {
  console.error(error);
  return 'Some error occurred. Please try again';
  }
}
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
