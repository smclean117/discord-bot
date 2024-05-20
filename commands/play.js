const { ApplicationCommandOptionType } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const { isInVoiceChannel } = require('../utils/voicechannel');
const { User } = require('../db/database'); // Importing the User model

module.exports = {
    name: 'play',
    description: 'Play a song in your channel!',
    options: [
        {
            name: 'query',
            type: ApplicationCommandOptionType.String,
            description: 'The song or video you want to play',
            required: true,
        },
    ],
    async execute(interaction) {
        const { default: Conf } = await import('conf');
        try {
            const inVoiceChannel = isInVoiceChannel(interaction);
            if (!inVoiceChannel) {
                return;
            }

            await interaction.deferReply();

            const player = useMainPlayer();
            let query = interaction.options.getString('query');
            let searchResult;

            // Check if the query is a Spotify link
            const isSpotifyLink = query.includes('spotify.com');
            
            if (isSpotifyLink) {
                // Perform search with the original query if it's a Spotify link
                searchResult = await player.search(query, {
                    requestedBy: interaction.user,
                });
            } else {
                // Perform search with the original query for other cases
                searchResult = await player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: 'youtube', // Explicitly specifying the search engine
                });
            }

            if (!searchResult.hasTracks()) return void interaction.followUp({ content: 'No results were found!' });

            // Track user command usage
            const userId = interaction.user.id;
            const [user, created] = await User.findOrCreate({
                where: { userId },
                defaults: { commandCount: 0 }
            });
            user.commandCount += 1;
            await user.save();

            try {
                const config = new Conf({ projectName: 'volume' });

                await player.play(interaction.member.voice.channel.id, searchResult.tracks[0], {
                    nodeOptions: {
                        metadata: {
                            channel: interaction.channel,
                            client: interaction.guild?.members.me,
                            requestedBy: interaction.user.username,
                        },
                        leaveOnEmptyCooldown: 300000,
                        leaveOnEmpty: true,
                        leaveOnEnd: false,
                        bufferingTimeout: 0,
                        volume: config.get('volume') || 10,
                    },
                });

                await interaction.followUp({
                    content: `⏱ | Loading your ${searchResult.playlist ? 'playlist' : 'track'}...`,
                });
            } catch (error) {
                console.error(error);
                interaction.followUp({ content: 'An error occurred while trying to play the track.' });
            }
        } catch (error) {
            console.error(error);
            interaction.followUp({ content: 'An error occurred while searching for the track.' });
        }
    },
};
