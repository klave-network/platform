import arg from 'arg';

export const parseArguments = (): { [key: string]: any } => {
    return arg(
        {
            '--help': Boolean,
            '--version': Boolean,
            '--name': String,
            // Aliases
            '-h': '--help',
            '-v': '--version'
        },
        { permissive: true }
    );
};
