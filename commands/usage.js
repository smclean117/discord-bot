const { ApplicationCommandOptionType } = require('discord.js');
const { User } = require('../db/database'); // Importing the User model

module.exports = {
    name: 'usage',
    description: 'Check how many times you have used the play command',
    async execute(interaction) {
        try {
            const userId = interaction.user.id;

            // Find the user in the database
            const user = await User.findOne({ where: { userId } });

            if (user) {
                await interaction.reply(`You have used the play command ${user.commandCount} times.`);
            } else {
                await interaction.reply('You have not used the play command yet.');
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while retrieving your usage data.');
        }
    },
};
