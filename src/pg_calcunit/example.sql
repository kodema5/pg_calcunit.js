-- deno run -A pg_calcunit.js --channel "pg_calcunit_example"  --on-calc "example.calc"

drop schema if exists example cascade;
create schema example;

-- do session initialization
-- or status check and callback to service
--

create table example.log (
    tz timestamp with time zone
        default current_timestamp,
    pre_init_value text
);

create function example.poll(n text)
    returns jsonb
    language plpgsql
as $$
begin
    insert into example.log(pre_init_value)
        values (current_setting('example.initialized', true));

    -- ensure session is initialized
    --
    if current_setting('example.initialized', true) is null
    then
        perform set_config('example.initialized', 'true', false);
    end if;

    return jsonb_build_object('status', 'ok');
end;
$$;


-- do calculation
--
create function example.calc(p jsonb)
    returns jsonb
    language plpgsql
as $$
begin
    perform example.poll(null);

    return p
        || jsonb_build_object(
            'initialized', current_setting('example.initialized', true)
        );
end;
$$;

-- call calcunit
--
select pg_notify('pg_calcunit_example', '{"a":123}');
select pg_notify('pg_calcunit_example', '{"b":123}');
select pg_notify('pg_calcunit_example', '{"c":123}');

select pg_sleep(1);

-- this session is not initialized (should be false)
select current_setting('example.initialized', true);

-- operations done in other session
--
select * from example.log;


