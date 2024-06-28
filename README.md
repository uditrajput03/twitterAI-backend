# TwitterAI Backend API - SmartTweet
## Install - 
## Frontend - https://github.com/Sagarpatidar0/Twitter-Extension
## Backend - https://github.com/uditrajput03/twitterAI-backend

### [📖 Documentation](https://uditrajput03.github.io/twitterAI-backend/)
### [📖 Documentation v2](https://uditrajput03.github.io/twitterAI-backend/doc.html)


## Overview
This repository contains the backend API for the SmartTweet Chrome extension, built using Cloudflare Workers. The API provides the necessary endpoints to generate AI-powered tweet replies based on the selected profile by the user. The AI functionalities are powered by Grok AI.

## Features
- **Serverless Architecture**: Powered by Cloudflare Workers for scalability and low latency.
- **Profile-Based Replies**: Generate replies tailored to different profiles (e.g., Professional, Humorous, Informative).
- **AI Integration**: Uses Grok AI for generating intelligent and contextually relevant replies.
- **API Documentation**: Comprehensive documentation for easy integration and usage.

## Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/your-username/smarttweet-backend.git
    ```
2. Navigate to the project directory:
    ```sh
    cd smarttweet-backend
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```
4. Devlopment and Testing
    ```sh
    npm run dev
    ```
5. Deploy the Cloudflare Worker:
    - Make sure you have [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update) installed and configured.
    - Deploy the worker using the following command:
        ```sh
        npm run deploy
        ```

## Usage
The backend API provides several endpoints to interact with the SmartTweet Chrome extension. You can find the detailed API documentation [here](https://uditrajput03.github.io/twitterAI-backend/).

## AI Integration with Grok
SmartTweet Backend API utilizes Grok AI for generating intelligent and contextually relevant replies. To integrate with Grok AI, ensure you have the necessary API key and configurations.

### Configuration
1. Ensure that you have the necessary Cloudflare account and API credentials configured in the `wrangler.toml` file.

## Contributing
We welcome contributions to improve the SmartTweet Backend API! If you would like to contribute, please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## Support
For any issues or questions, please contact our us.

## License
SmartTweet Backend API is licensed under the MIT License. See the LICENSE file for more details.

---

Thank you for contributing to the SmartTweet ecosystem!