import { FastifyInstance, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import chalk from 'chalk';

type FastifyReplyWithStartTime = FastifyReply & {
    timeStart: number;
};

type FastifyReplyWithSkip = FastifyReplyWithStartTime & {
    skipResponse?: boolean;
};

let totalPingCount = 0;

export const logger = fp(async (fastify: FastifyInstance) => {

    console.info(`${chalk.cyan(new Date().toISOString().replace('T', ' ').replace('Z', ''))} notifier > ${chalk.green('info')}: ${chalk.green('Enabling logger...')}`);

    fastify.addHook('onRequest', async (request, response) => {
        (response as FastifyReplyWithStartTime).timeStart = Date.now();
        if ((request.url === '/ping' || request.url === '/version') && request.headers['x-kube-probe'] !== undefined) {
            (response as FastifyReplyWithSkip).skipResponse = true;
            totalPingCount++;
            if (totalPingCount % 1000 === 0)
                return fastify.log.info(`The runtime probe has pinged ${totalPingCount} times...`);
            else
                return;
        }
    });

    fastify.addHook('onResponse', async (request, response) => {
        if ((response as FastifyReplyWithSkip).skipResponse === true)
            return;
        const totalTime = Date.now() - (response as FastifyReplyWithStartTime).timeStart;
        console.info(`${chalk.cyan(`${new Date().toISOString().replace('T', ' ').replace('Z', '')} notifier >`)} ${chalk.magenta('http')}: ${chalk.magenta(`${request.ip} ${request.method.toUpperCase()} ${request.url} ${response.statusCode}  - ${totalTime} ms`)}`);
    });
});
