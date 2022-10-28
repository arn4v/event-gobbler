import { FastifyPluginAsync } from "fastify";
import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";
import { EventPayloadSchema } from "./validators/event";
import { IdentifyPayloadSchema } from "./validators/identify";

function handleTrackRequest(rq: FastifyRequest, rp: FastifyReply) {
  console.log(rq.body);
  rp.code(200).send();
}

function handleIdentifyRequest(rq: FastifyRequest, rp: FastifyReply) {
  console.log(rq.body);
  rp.code(200).send();
}

interface EventGobblerPluginOptions {
  prefix?: string;
  identify(payload: IdentifyPayloadSchema): Promise<void>;
  track(payload: EventPayloadSchema): Promise<void>;
}

export const pluginAsync: FastifyPluginAsync<
  EventGobblerPluginOptions
> = async (app: FastifyInstance, opts) => {
  const trackPath = `${opts.prefix ? `/${opts.prefix}` : ""}/track`;
  app.post(trackPath, handleTrackRequest);

  const identifyPath = `${opts.prefix ? `/${opts.prefix}` : ""}/identify`;
  app.post(identifyPath, handleIdentifyRequest);
};

export const eventGobblerPlugin = fp(pluginAsync, "4.x");
