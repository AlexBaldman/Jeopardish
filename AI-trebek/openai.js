

async function generateResponse(prompt) {
    const url = 'https://api.openai.com/v1/engines/davinci-codex/completions';
    const api_key = 'YOUR_API_KEY_HERE';
  
    // Create the request body with the prompt and other parameters
    const requestBody = {
      prompt: prompt,
      max_tokens: 100, // Limit the response to 100 tokens
      n: 1, // Only generate one completion
      stop: '\n', // Stop generation at the end of the sentence
      temperature: 0.7 // Control the creativity of the AI's response
    };
  
    // Send the request to the OpenAI API and wait for the response
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}` // Include your API key in the Authorization header
      },
      body: JSON.stringify(requestBody) // Convert the request body to a JSON string
    });
  
    // Parse the response JSON and return the generated text
    const { choices } = await response.json(); // Extract the choices array from the response JSON
    return choices[0].text; // Assume we only requested one completion and return the text of the first choice
  }
  
  // Example usage:
  const prompt = 'Hello, Android Alex Trebek.'; // Prompt for the AI to generate a response to
  const response = await generateResponse(prompt); // Generate a response and wait for it to be returned
  console.log(response); // Log the response to the console
  



// async function generateResponse(prompt) {
//     const url = 'https://api.openai.com/v1/engines/davinci-codex/completions';
//     const api_key = 'YOUR_API_KEY_HERE';
  
//     // Create the request body with the prompt and other parameters
//     const requestBody = {
//       prompt: prompt,
//       max_tokens: 100,
//       n: 1,
//       stop: '\n',
//       temperature: 0.7
//     };
  
//     // Send the request to the OpenAI API and wait for the response
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${api_key}`
//       },
//       body: JSON.stringify(requestBody)
//     });
  
//     // Parse the response JSON and return the generated text
//     const { choices } = await response.json();
//     return choices[0].text;
//   }
  
//   // Example usage:
//   const prompt = 'Hello, Android Alex Trebek.';
//   const response = await generateResponse(prompt);
//   console.log(response);
  


