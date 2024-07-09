# ClassItemAPI

## Overview

Tracks new Class Items Acquired and the perks they rolled.

## IMPORTANT

This doesn't use bungie's OAuth2, so you need to enable `Show my non-equipped inventory` [https://www.bungie.net/7/en/User/Account/Privacy]

![image](https://github.com/nyzuu/Destiny2API/assets/45524358/ec131f2a-bb67-4e34-8a1a-b84e5d9f0bff)


## Getting Started

To get started, follow these steps:

1. Sign up for a Bungie.net account and obtain an API key (https://www.bungie.net/en/Application , Create a Confidential Application with `Read your Destiny 2 information (Vault, Inventory, and Vendors), as well as Destiny 1 Vault and Inventory data.` Enabled).
2. Clone this repository to your local machine.
3. Install the required dependencies by running `npm install`.
4. Set your API key and Discord Webhook URL in the configuration file (`.env`). If there is not a `.env` file, simply rename `example.env` to `.env`.
5. Run the application using `node index.js`.

## Usage

Modify the variables in the `index.js` file:
`REQUEST_INTERVAL` - Not required to change, default is 25 minutes
`MEMBERSHIP_TYPE` - Bungie account type.
`MEMBERSHIP_ID` - Bungie account ID.

Both Type and ID can be found on your profile url. (Bungie.com > view profile)
![image](https://github.com/nyzuu/Destiny2API/assets/45524358/5cba13b0-fc62-416b-a006-1a5ba08ddfab)


## Contributing

Contributions to this repository are welcome. If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
