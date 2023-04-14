import { config, parse } from './deps.js'

let ArgFlags = {
    l: 'LIB',
    w: 'WATCH',
    c: 'CHANNEL',
}

export let argv = Object.assign(
    // application default values
    //
    {
        PGHOST: 'localhost',    // pg connections
        PGPORT: 5432,
        PGDATABASE: 'web',
        PGUSER: 'web',
        PGPASSWORD: 'rei',

        PGIDLE_TIMEOUT: 0,      // in s
        PGCONNECT_TIMEOUT: 30,  // in s

        // below are required!
        PGPOOLSIZE: 1,      // has to be one
        PGMAX_LIFETIME: 0,  // forever/keep-alive

        NAME: Deno.hostname() + ':' + Deno.pid,
        CHANNEL: 'pg_calcunit:' + Deno.hostname() + ':' + Deno.pid,

        // "select on_poll('name'::text)"
        // it can be use for initialization and or
        //
        ON_POLL: '', // poll poll_fn(text)
        ON_POLL_INT: 0, // poll interval in ms (if want to keep-alive)

        // "select on_calc('%s'::on_calc_type)"
        //
        ON_CALC: '', // when notification for calc
        ON_CALC_TYPE: 'jsonb', // parameters to be passed
    },

    // read from .env / .env.defaults
    //
    config(),

    // command line arguments
    //
    Object.entries(parse(Deno.args))
        .map( ([k,v]) => {
            let n = ArgFlags[k]
                || k.toUpperCase().replaceAll('-','_')
            return { [n]: v}
        })
        .reduce((x,a) => {
            return Object.assign(x,a)
        }, {})
)
