import Chatter from '../socket';

const config = {
    description: `An amazing command!`,
    aliases: [],
    usage: ``
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {

};

export {
    config,
    run
};
