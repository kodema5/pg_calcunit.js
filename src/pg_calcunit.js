// some calcs may need a long initialization in a session
// pg's inter-sessions is via listen/notify via external client-app

import { postgres, } from './pg_calcunit/deps.js'
import { argv, } from './pg_calcunit/argv.js'

await (async () =>{

    let cfg = {
        host: argv.PGHOST,
        port: argv.PGPORT,
        user: argv.PGUSER,
        pass: argv.PGPASSWORD,
        database: argv.PGDATABASE,

        // max:1, max_lifetime:0 to ensure session kept-alive
        max: argv.PGPOOLSIZE,
        max_lifetime: argv.PGMAX_LIFETIME,

        idle_timeout: argv.PGIDLE_TIMEOUT,
        connect_timeout: argv.PGCONNECT_TIMEOUT,

        onnotice: (msg) => console.log(msg.severity, msg.message),
    }

    console.log(`pg_calcunit.js connects to ${cfg.host}:${cfg.port}/${cfg.database}`)
    let sql = postgres(cfg)


    console.log(`pg_calcunit.js listens to ${argv.CHANNEL} channel`)
    console.log(`pg_calcunit.js calcs by ${argv.ON_CALC}(${argv.ON_CALC_TYPE}) function`)
    var busy = false
    let poll_int

    let listener = await sql.listen(
        argv.CHANNEL,
        async (payload) => {

            if (!argv.ON_CALC) {
                console.log('pg_calcunit.js [CALC]', payload)
                return
            }

            busy = true
            try {
                let s = await sql.begin(async sql => {
                    let a = await sql.unsafe(`
                    select ${argv.ON_CALC}(
                        '${payload}'::${argv.ON_CALC_TYPE}
                    ) a`)
                    return a
                })

                if (s) console.log(
                    `pg_calcunit.js [CALC] OK`,
                    s?.[0]?.a
                )
            } catch(e) {
                console.log(
                    `pg_calcunit.js [CALC] ERR select ${argv.ON_CALC}(...)`,
                    e.message)
            }
            busy = false
        },


        // if to initialize/poll the session
        //
        () => {
            if (!argv.ON_POLL) return

            let f = async () => {
                if (busy) return

                try {
                    let s = await sql.unsafe(
                        `select ${argv.ON_POLL}(
                            '${argv.NAME}'
                        ) a`)
                    if (s) console.log(
                        `pg_calcunit.js [POLL] OK`,
                        s?.[0]?.a
                    )

                    // todo -- process return from poll
                    // ex: to shutdown?
                    //
                } catch(e) {
                    console.log(
                        `pg_calcunit.js [POLL] ERR select ${argv.ON_POLL}(...)`,
                        e.message)
                    }
            }
            if (argv.ON_POLL_INT) {
                poll_int = setInterval(f, argv.ON_POLL_INT)
            }
            f()
        })
})()

export let exec = async (str) => {
    if (!str) return
    return await sql.unsafe(str)
}
