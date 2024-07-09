const fs       = require('fs');
const client   = require('https');
const axios    = require('axios');
const sharp    = require('sharp');
const FormData = require('form-data');
const { Webhook, MessageBuilder} = require('discord-webhook-node');

const WEBHOOK_URL = ""; // Discord Webhook URL
const API_KEY     = "";     // Bungie API Key

const MEMBERSHIP_TYPE = "3"; // 1 = Xbox, 2 = PSN, 3 = Steam,
const MEMBERSHIP_ID   = "1231241241231231"; // Bungie Acc Id
const REQUEST_INTERVAL = 25; // How many minutes between each inventory check


// Don't change unless you know the hashes of other items you're farming
const ITEM_HASHES = [
    2809120022, // Relativism
    266021826,  // Stoicism
    2273643087, // Solipsism
];

function download(url, filepath) {
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
}

const uploadImage = async (filePath) => {
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));
    
        const response = await axios.post('https://uguu.se/upload', form, {
          headers: form.getHeaders()
        });

        return response.data.files[0].url;
    } catch (error) {
      console.error('Error uploading file:', error);
    }
};

const hook = new Webhook(WEBHOOK_URL);
const INVENTORY_FILE_PATH = __dirname + '/inventory.json';

async function getInventory() {
    try {
        const response = await axios.get(`https://www.bungie.net/Platform/Destiny2/${MEMBERSHIP_TYPE}/Profile/${MEMBERSHIP_ID}/?components=201,302`, {
            headers: {
                'X-API-Key': API_KEY,
            }
        });

        const characterInventories = response.data.Response.characterInventories.data;
        const itemPerks = response.data.Response.itemComponents.perks.data;
        var CurrentInventory = []
        
        // Iterate all characters' inventories
        for (const characterId in characterInventories) {
            // Iterate inventories for specific item
            for (const item of characterInventories[characterId].items) {
                // Check if item hash is in the list of wanted hashes
                if (ITEM_HASHES.includes(item.itemHash)) {
                    CurrentInventory.push(item.itemInstanceId)
                }
            }
        }

        // Check if the inventory file exists
        if (!fs.existsSync(INVENTORY_FILE_PATH)) {
            fs.writeFileSync(INVENTORY_FILE_PATH, JSON.stringify(CurrentInventory, null, 2));
            return; // Doesn't need to check for new items on first run
        }

        // Filter new items from last check
        var last_inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE_PATH));
        var new_inventory = [];

        // Iterate through current inv
        for (const item of CurrentInventory) {
            // Check if item is new or not
            if (!last_inventory.includes(item)) {
                const perkData = itemPerks[item].perks;
                var perks = [];

                // Iterate through perks
                for (const perk of perkData) {
                    // Fetch perk data (name and icon)
                    const response = await axios.get(`https://www.bungie.net/Platform/Destiny2/Manifest/DestinySandboxPerkDefinition/${perk.perkHash}/`, {
                        headers: {
                            'X-API-Key': API_KEY,
                        }
                    });

                    const perkName = response.data.Response.displayProperties.name;
                    const iconPath = response.data.Response.displayProperties.icon;

                    // check if perkname contains "Sprit of"
                    if (perkName.includes("Spirit of")) {
                        perks.push({
                            "perkName": perkName,
                            "iconPath": iconPath,
                            "perkHash": perk.perkHash,
                        })
                    }
                }

                // Create images folder if does not exist
                if (!fs.existsSync(__dirname + '/perk_images')) {
                    fs.mkdirSync(__dirname + '/perk_images');
                }

                // check if perk image exists by hash id
                for (const perk of perks) {
                    const imagePath = __dirname + `/perk_images/${perk.perkHash}.png`;
                    if (!fs.existsSync(imagePath)) {
                       // Download image & cache it
                       await download(`https://www.bungie.net${perk.iconPath}`, __dirname + `/perk_images/${perk.perkHash}.png`).catch(console.error);
                    }
                }

                // Stitch images together and upload to uguu.se (temporary file uploader)
                const images = [
                    fs.readFileSync(__dirname + `/perk_images/${perks[0].perkHash}.png`),
                    fs.readFileSync(__dirname + `/perk_images/${perks[1].perkHash}.png`),
                ]
                await sharp({
                    create: {
                        width: 96*2 + 75,
                        height: 96,
                        channels: 4,
                        background: { r: 0, g: 176, b: 244, alpha: 0 },
                    },
                })
                .composite(
                    images.map((image, index)=>({
                        input: image,
                        left: (index)*(96 + 75),
                        top: parseInt(index/100),
                        width: 96,
                        height: 96,
                    }))
                ) 
                .toFile(__dirname + '/output.png');
                
                const embed = new MessageBuilder()
                .setAuthor('New Class Item')
                .addField("Perk 1", perks[0].perkName, true)
                .addField("Perk 2", perks[1].perkName, true)
                .setColor('#00b0f4')
                .setTimestamp()
                .setImage(await uploadImage(__dirname + '/output.png'));
                
                hook.send(embed)
                // hook.sendFile(__dirname + '/output.png');

                new_inventory.push(item);
            }
        }

        // Write the updated inventory to the file
        fs.writeFileSync(INVENTORY_FILE_PATH, JSON.stringify(CurrentInventory, null, 2));
    } catch (error) {
        console.error('Error retrieving inventory:', error);
    }
}

console.log('Running Class Item Tracker...');

// Run every X minutes
setInterval(getInventory, REQUEST_INTERVAL * 60 * 1000);