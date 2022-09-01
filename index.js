const {
  Client,
  GatewayIntentBits,
  ClientApplication,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  SelectMenuBuilder,
  TextInputBuilder,
  ModalBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

client
    .on("debug", console.log)
    .on("warn", console.log)

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const { Modal, TextInputComponent, showModal } = require("discord-modals");
const { QuickDB } = require("quick.db");
const { markdownToTxt } = require("markdown-to-txt");

const db = new QuickDB();
const token = process.env["token"];
const express = require("express");
const app = express();

const rest = new REST({ version: "10" }).setToken(
  "MTAwODcxMjg4NzMwMjM2MTE2OA.GHiFHa.RghfxfU44YsOU-DlAfbCwhODm-FK826A53GXcQ"
);

app.get("/", function (req, res) {
  res.send("Essential Notify Coin Bot. Made by xDestino.");
});

try {
  app.listen(3000);
} catch (err) {
  console.log("Express error!");
}

let commands = [
    {
      name: "coins",
      description: "Displays the amount of coins a user has",
      options: [
        {
          name: "user",
          description: "User of whose coins you'd like to see",
          required: false,
          type: 6,
        },
      ],
    },
    {
      name: "inventory",
      description: "Displays the inventory of a user",
      options: [
        {
          name: "user",
          description: "User of whose inventory you'd like to see",
          required: false,
          type: 6,
        },
      ],
    },
    {
      name: "removeitem",
      description: "Removes item from the inventory of the mentioned user",
      options: [
        {
          name: "user",
          description: "User of whose item you'd like to remove",
          required: true,
          type: 6,
        },
        {
          name: "index",
          description: "Index of the item you'd like to remove",
          required: true,
          type: 4,
        },
      ],
    },
    {
      name: "addmoney",
      description:
        "Adds money to a mentioned user (requires the Manage Server permission)",
      options: [
        {
          name: "user",
          description: "User you'd like to add coins to",
          required: true,
          type: 6,
        },
        {
          name: "amount",
          description: "Amount of coins you would like to add to the user",
          required: true,
          type: 10,
        },
      ],
    },
    {
      name: "removemoney",
      description:
        "Removes money from a mentioned user (requires the Manage Server permission)",
      options: [
        {
          name: "user",
          description: "User you'd like to remove coins from",
          required: true,
          type: 6,
        },
        {
          name: "amount",
          description: "Amount of coins you would like to remove from the user",
          required: true,
          type: 10,
        },
      ],
    },
    {
      name: "refreshcmds",
      description: "Refreshes slash commands (requires the Manage Server permission)",
    },
    {
      name: "increment",
      description:
        "Configure coins granted by channel (requires the Manage Server permission)",
      options: [
        {
          name: "modify",
          description: "User you'd like to remove coins from",
          type: 1,
          options: [
            {
              name: "channel",
              description:
                "Channel where you'd like to change the coin increment",
              required: true,
              type: 7,
            },
            {
              name: "amount",
              description:
                "Amount of coins you would like to be granted for each message",
              required: true,
              type: 10,
            },
          ],
        },
        {
          name: "get",
          description:
            "See the amount of coins you would like to be granted for each message",
          type: 1,
          options: [
            {
              name: "channel",
              description:
                "Channel where you'd like to change the coin increment",
              required: true,
              type: 7,
            },
          ],
        },
      ],
    },
    {
      name: "shop",
      description: "See the shops information and items",
      options: [
        {
          name: "view",
          description: "View items from the shop",
          type: 1,
        },
        {
          name: "edit",
          description:
            "Modify items from the shop (requires the Manage Server permission)",
          type: 1,
          options: [
            {
              name: "index",
              description: "Index of the item",
              type: 4,
              required: true,
            },
          ],
        },
        {
          name: "add",
          description:
            "Add items to the store (requires the Manage Server permission)",
          type: 1,
          options: [
            {
              name: "name",
              description: "Name of the item",
              type: 3,
              required: true,
            },
            {
              name: "price",
              description: "Price of the item",
              type: 4,
              required: true,
            },
            {
              name: "stock",
              description: "Stock of the item",
              type: 4,
              required: true,
            },
          ],
        },
        {
          name: "remove",
          description:
            "Remove items from the shop (requires the Manage Server permission)",
          type: 1,
          options: [
            {
              name: "index",
              description: "Index of the item",
              type: 4,
              required: true,
            },
          ],
        },
        {
          name: "buy",
          description: "Buy an item from the shop",
          type: 1,
          options: [
            {
              name: "index",
              description: "Index of the item",
              type: 4,
              required: true,
            },
          ],
        },
      ],
    },
  ];

//////////////////// ACTUAL BOT STUFF ///////////////////////

client.login(token);

async function setUpNewUser(guildId, userId) {
  return await db.set(`${guildId}_${userId}`, {
    userId: userId,
    coins: 0,
    inv: [],
  });
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  console.log("interaction!");
  if (!interaction.isChatInputCommand()) return;
  let guildId = interaction.member.guild.id;

  let increment = await db.get(`${interaction.channel.id}_increment`);
  if (!increment) {
    increment = 0.01;
    await db.set(`${interaction.channel.id}_increment`, increment);
  }

  await db.set(
    `${interaction.channel.id}_increment`,
    parseFloat(increment.toFixed(2))
  );

  async function getUserFromUsers(userId) {
    if (!userId) return;

    let user = await db.get(`${guildId}_${userId}`);

    if (!user) {
      await setUpNewUser(guildId, userId);
      user = await db.get(`${guildId}_${userId}`);
    }

    return await user;
  }

  function getUsernameFromID(id) {
    return client.users.cache.get(toString(id));
  }

  if (interaction.commandName === "coins") {
    let mentioned = interaction.options.getUser("user");
    let user = await getUserFromUsers(interaction.member.id);
    let mentionedUser = mentioned
      ? await getUserFromUsers(mentioned.id)
      : undefined;

    let coinsEmbed = new EmbedBuilder().setColor("#0080ff");

    if (mentionedUser && mentioned) {
      coinsEmbed.setDescription(
        `<@${mentioned.id}> has **${mentionedUser.coins}** coins.`
      );
      await interaction.reply({ embeds: [coinsEmbed], ephemeral: true });
    } else {
      coinsEmbed.setDescription(`You have **${user.coins}** coins.`);
      await interaction.reply({ embeds: [coinsEmbed] });
    }
  }

  function errorEmbed(permissions) {
    let embed = new EmbedBuilder()
      .setColor("#ff0037")
      .setTitle("You don't have the required permissions to run this command!")
      .setDescription("Required permissions: \n```" + permissions + "```");

    return embed;
  }

  if (interaction.commandName === "addmoney") {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return await interaction.reply({
        embeds: [errorEmbed(" - Manage Server")],
        ephemeral: true,
      });
    }

    let amount = Math.abs(interaction.options.getNumber("amount"));

    let mentioned = interaction.options.getUser("user");
    let mentionedUser = mentioned
      ? await getUserFromUsers(mentioned.id)
      : undefined;

    let embed = new EmbedBuilder()
      .setColor("#00ff55")
      .setTitle(`${interaction.member.displayName} 📥 ${mentioned.username}`)
      .setDescription(
        `**${amount}** coin(s) have succesfully been given to ${mentioned.username}!`
      );

    db.add(`${guildId}_${mentioned.id}.coins`, amount);
    interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "removemoney") {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return await interaction.reply({
        embeds: [errorEmbed(" - Manage Server")],
        ephemeral: true,
      });
    }

    let amount = Math.abs(interaction.options.getNumber("amount"));

    let mentioned = interaction.options.getUser("user");
    let mentionedUser = mentioned
      ? await getUserFromUsers(mentioned.id)
      : undefined;

    let embed = new EmbedBuilder()
      .setColor("#00ff55")
      .setTitle(`${interaction.member.displayName} 📤 ${mentioned.username}`)
      .setDescription(
        `**${amount}** coin(s) have succesfully been removed from ${mentioned.username}!`
      );

    if (mentionedUser.coins - Math.abs(amount) >= 0) {
      db.add(`${guildId}_${mentioned.id}.coins`, -Math.abs(amount));
    } else {
      db.set(`${guildId}_${mentioned.id}.coins`, 0);
    }

    interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "shop") {
    let shop = await db.get(`${guildId}_shop`);
    if (!shop) {
      await db.set(`${guildId}_shop`, []);

      shop = await db.get(`${guildId}_shop`);
    }

    let subcommand = interaction.options.getSubcommand(true);
    console.log(subcommand);
    if (subcommand == "view") {
      function arrayToText(array) {
        let items = ``;
        if (shop.length != 0) {
          shop.map(
            (x, i) =>
              (items += `${"`[" + i + "]`"} ${x.price}EN - ${x.name} (Stock ${
                x.stock
              }) \n`)
          );
        } else {
          items = "__*Es ist nichts auf Lager*__";
        }

        return items;
      }

      let text = [
        "Wilkommen zum **Essential Notify Coin Shop!** 🛍️ Hier kannst du deine Essential Notify Coins gegen Preise eintauschen, aber erstmal...",
        "",
        "__**Was ist überhaupt ein “Essential Notify Coin”? **__",
        "",
        "> Der Essential Notify Coin ist unsere neue Server Währung immer, wenn ihr im Chat schreibt , Bilder in Success postet oder anderen helft bekommt ihr Coins. Auch für das dabei sein im Call gibt es zusätzlich Coins und für das Posten von guten Pings und Infos werden auch Coins verteilt. Je Markierung auf Twitter oder Instagram von uns erhaltet ihr zusätzlich auch noch 2 Coins. ",
        "",
        "> Manche Preise sind limitiert und können teilweise nicht mehr verfügbar sein, wir versuchen die Preise regelmäßig zu restocken",
        "",
        "💰 __**Prizes:**__ 💰",
        `${arrayToText(shop)}`,
        "",
        "Die Essential Notify Coins laufen nicht ab und sind so lange gültig, bis ihr eure Mitgliedschaft beendet",
      ];

      let embed = new EmbedBuilder()
        .setColor("#0080ff")
        .setTitle(`Willkommen zum Store!`)
        .setDescription(text.join("\n"))
        .setThumbnail("https://i.ibb.co/RcqVjbJ/image-1-2.png");

      interaction.reply({ embeds: [embed] });
    } else if (subcommand == "edit") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ManageGuild
        )
      ) {
        return await interaction.reply({
          embeds: [errorEmbed(" - Manage Server")],
          ephemeral: true,
        });
      }

      let itemIndex = interaction.options.getInteger("index");
      if (Math.abs(itemIndex) < shop.length) {
        let embed = new EmbedBuilder()
          .setColor("#0080ff")
          .setTitle(`What would you like to change about the item?`);

        const row = new ActionRowBuilder().addComponents(
          new SelectMenuBuilder()
            .setCustomId(`${itemIndex}_shop`)
            .setPlaceholder(`${markdownToTxt(shop[itemIndex].name)}`)
            .addOptions(
              {
                label: "Name",
                description: "Change the name of the item",
                value: "name_option",
                emoji: "✏️",
              },
              {
                label: "Price",
                description: "Change the price of the item",
                value: "price_option",
                emoji: "🏷️",
              },
              {
                label: "Stock",
                description: "Change the stock amount of the item",
                value: "stock_option",
                emoji: "📦",
              }
            )
        );

        interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
      } else {
        let embed = new EmbedBuilder()
          .setColor("#ff0037")
          .setTitle("There is no item with the index you have specified!")
          .setDescription("Please try again with a valid index");

        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else if (subcommand == "add") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ManageGuild
        )
      ) {
        return await interaction.reply({
          embeds: [errorEmbed(" - Manage Server")],
          ephemeral: true,
        });
      }

      let name = interaction.options.getString("name");
      let price = interaction.options.getInteger("price");
      let stock = interaction.options.getInteger("stock");

      await db.push(`${guildId}_shop`, {
        name: name,
        price: price,
        stock: stock,
      });

      let embed = new EmbedBuilder()
        .setColor("#0080ff")
        .setTitle(`${name} has been added to the shop`);

      interaction.reply({ embeds: [embed] });
    } else if (subcommand == "remove") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ManageGuild
        )
      ) {
        return await interaction.reply({
          embeds: [errorEmbed(" - Manage Server")],
          ephemeral: true,
        });
      }

      let index = interaction.options.getInteger("index");

      if (Math.abs(index) < shop.length) {
        let embed = new EmbedBuilder()
          .setColor("#00ff55")
          .setTitle(`The item has been removed from the shop`)
          .setDescription(
            `${"```"} - Name: ${markdownToTxt(shop[index].name)}\n - Price: ${
              shop[index].price
            }\n - Stock: ${shop[index].stock}\n${"```"}`
          );

        shop.splice(index, 1);
        await db.set(`${guildId}_shop`, shop);

        interaction.reply({ embeds: [embed] });
      } else {
        let embed = new EmbedBuilder()
          .setColor("#ff0037")
          .setTitle("There is no item with the index you have specified!")
          .setDescription("Please try again with a valid index");

        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else if (subcommand == "buy") {
      let index = interaction.options.getInteger("index");

      if (Math.abs(index) < shop.length) {
        let user = await getUserFromUsers(interaction.member.id);

        if (user.coins >= shop[index].price && user.inv.length < 10) {
          user.inv.push(shop[index]);
          user.coins -= shop[index].price;

          let embed = new EmbedBuilder()
            .setColor("#00ff55")
            .setTitle("You have succesfully bought this item!")
            .setDescription(
              `${"```"} - Name: ${markdownToTxt(shop[index].name)}\n - Price: ${
                shop[index].price
              }\n - Stock: ${shop[index].stock}\n${"```"}`
            );

          db.set(`${interaction.guild.id}_${interaction.member.id}`, user);
          interaction.reply({ embeds: [embed] });
        } else if (user.inv.length == 10) {
          let embed = new EmbedBuilder()
            .setColor("#ff0037")
            .setTitle("You don't have enough inventory space! (Max: 10)")
            .setDescription("Delete an item using /removeitem");

          interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
          let embed = new EmbedBuilder()
            .setColor("#ff0037")
            .setTitle("You dont have enough coins to buy this item!")
            .setDescription("Gain coins by messaging!");

          interaction.reply({ embeds: [embed], ephemeral: true });
        }
      } else {
        let embed = new EmbedBuilder()
          .setColor("#ff0037")
          .setTitle("There is no item with the index you have specified!")
          .setDescription("Please try again with a valid index");

        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }

  if (interaction.commandName === "inventory") {
    let mentioned = interaction.options.getUser("user");
    let user = await getUserFromUsers(interaction.member.id);
    let mentionedUser = mentioned
      ? await getUserFromUsers(mentioned.id)
      : undefined;

    function arrayToText(array) {
      let items = ``;
      array.map((x, i) => (items += `[${i}] - ${x.name}\n`));

      return items;
    }

    if (mentionedUser && mentioned) {
      if (mentionedUser.inv.length > 0) {
        let embed = new EmbedBuilder()
          .setColor("#0080ff")
          .setTitle(`${mentioned.username}'s inventory:`)
          .setDescription(arrayToText(mentionedUser.inv));

        interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        let embed = new EmbedBuilder()
          .setColor("#ff0037")
          .setTitle("This user has no items in their inventory!");

        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else {
      if (user.inv.length > 0) {
        let embed = new EmbedBuilder()
          .setColor("#0080ff")
          .setTitle("Your inventory:")
          .setDescription(arrayToText(user.inv));

        interaction.reply({ embeds: [embed] });
      } else {
        let embed = new EmbedBuilder()
          .setColor("#ff0037")
          .setTitle("You have no items in your inventory!");

        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }

  if (interaction.commandName === "removeitem") {
    let mentioned = interaction.options.getUser("user");
    let mentionedUser = mentioned
      ? await getUserFromUsers(mentioned.id)
      : undefined;
    let index = interaction.options.getInteger("index");

    function arrayToText(array) {
      let items = ``;
      array.map((x, i) => (items += `[${i}] - ${x.name}\n`));

      return items;
    }

    if (mentionedUser && mentioned) {
      if (
        mentioned.id != interaction.member.id &&
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ManageGuild
        )
      ) {
        return await interaction.reply({
          embeds: [errorEmbed(" - Manage Server")],
          ephemeral: true,
        });
      }

      if (Math.abs(index) < mentionedUser.inv.length) {
        let embed = new EmbedBuilder()
          .setColor("#00ff55")
          .setTitle(
            `You have succesfully removed ${mentioned.username}'s item`
          );

        mentionedUser.inv.splice(index, 1);
        await db.set(
          `${interaction.guild.id}_${interaction.member.id}`,
          mentionedUser
        );
        interaction.reply({ embeds: [embed] });
      } else {
        let embed = new EmbedBuilder()
          .setColor("#ff0037")
          .setTitle("There is no item with the index you have specified!")
          .setDescription("Please try again with a valid index");

        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }

  if (interaction.commandName === "increment") {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return await interaction.reply({
        embeds: [errorEmbed(" - Manage Server")],
        ephemeral: true,
      });
    }

    let channel = interaction.options.getChannel("channel");
    let subcommand = interaction.options.getSubcommand(true);

    let increment = await db.get(`${channel.id}_increment`);
    if (!increment) {
      increment = 0.01;
      await db.set(`${channel.id}_increment`, increment);
    }

    if (subcommand == "modify") {
      let increment = interaction.options.getNumber("amount");

      let embed = new EmbedBuilder()
        .setColor("#00ff55")
        .setTitle(
          `You have succesfully modified the amount coins granted in ${channel.name} to ${increment}!`
        );

      await db.set(`${channel.id}_increment`, increment);
      interaction.reply({ embeds: [embed] });
    }

    if (subcommand == "get") {
      let embed = new EmbedBuilder()
        .setColor("#0080ff")
        .setTitle(
          `The amount of coins each message grant a user in ${channel.name} is ${increment}!`
        );

      interaction.reply({ embeds: [embed] });
    }
  }

  if (interaction.commandName === "refreshcmds") {
          if (
              !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
            ) {
              return await interaction.reply({
                embeds: [errorEmbed(" - Manage Server")],
                ephemeral: true,
              });
            }
          
          try {
            console.log("Started refreshing application (/) commands.");
            interaction.reply({ content: "Refreshing...", ephemeral: true });
                  
            await rest.put(
              Routes.applicationGuildCommands(
                "1008712887302361168",
                "980564626158796891"
              ),
              { body: commands }
            );
                  
            console.log("Successfully reloaded application (/) commands.");
          } catch (error) {
            console.error(error);
          }
  }
});

client.on("interactionCreate", async (interaction) => {
  let shop = await db.get(`${interaction.guild.id}_shop`);
  if (!interaction.isSelectMenu()) return;

  let modal = new Modal() // We create a Modal
    .setCustomId("editValues")
    .addComponents(
      new TextInputComponent() // We create an Text Input Component
        .setCustomId("editValues")
        .setLabel("Change value to")
        .setStyle("SHORT") //IMPORTANT: Text Input Component Style can be 'SHORT' or 'LONG'
        .setMinLength(1)
        .setMaxLength(60)
        .setPlaceholder("Value")
        .setRequired(true) // If it's required or not
    );

  for (let i = 0; i < shop.length; i++) {
    if (interaction.customId === `${i}_shop`) {
      if (interaction.values[0]) {
        if (interaction.values[0] == "name_option") {
          modal.setTitle("Editing the name!");
        } else if (interaction.values[0] == "price_option") {
          modal.setTitle("Editing the price!");
        } else if (interaction.values[0] == "stock_option") {
          modal.setTitle("Editing the stock amount!");
        }

        modal.setCustomId(`${i}_${interaction.values[0]}`);
      }

      showModal(modal, {
        client: client, // The showModal() method needs the client to send the modal through the API.
        interaction: interaction, // The showModal() method needs the interaction to send the modal with the Interaction ID & Token.
      });
    }
  }
});

let states = ["name_option", "price_option", "stock_option"];
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  let shop = await db.get(`${interaction.guild.id}_shop`);

  for (let i = 0; i < shop.length; i++) {
    for (let x = 0; x < states.length; x++) {
      if (interaction.customId === `${i}_${states[x]}`) {
        let text = interaction.components[0].components[0].value;
        if (states[x] == "name_option") {
          shop[i].name = text;
        } else if (states[x] == "price_option") {
          if (!parseInt(text)) {
            shop[i].price = 1;
          } else {
            shop[i].price = parseInt(text);
          }
        } else if (states[x] == "stock_option") {
          shop[i].stock = text;
        }

        await db.set(`${interaction.guild.id}_shop`, shop);
        await interaction.reply({ content: `Updated!`, ephemeral: true });
      }
    }
  }
});

client.on("messageCreate", async (message) => {
  let guildId = message.guild.id;
  let user = await db.get(`${guildId}_${message.author.id}`);
  if (message.author.bot) return;

  if (!user) {
    await setUpNewUser(guildId, message.author.id);
  }

  if (user) {
    let increment = await db.get(`${message.channel.id}_increment`);
    if (!increment) {
      increment = 0.01;
      await db.set(`${message.channel.id}_increment`, increment);
    }

    await db.add(`${guildId}_${message.author.id}.coins`, increment);

    let usersCoins = await db.get(`${guildId}_${message.author.id}.coins`);
    await db.set(
      `${guildId}_${message.author.id}.coins`,
      parseFloat(usersCoins.toFixed(2))
    );
  }
});
