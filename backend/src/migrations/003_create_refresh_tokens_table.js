exports.up = (knex) => {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').index();
    table.text('token').unique().notNullable().index();
    table.string('family', 64).index();
    table.string('fingerprint', 64);
    table.jsonb('device_info').defaultTo('{}');
    table.inet('ip_address');
    table.boolean('used').defaultTo(false);
    table.timestamp('last_used_at');
    table.timestamp('expires_at').notNullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Composite indexes
    table.index(['user_id', 'used']);
    table.index(['family', 'used']);
  });
};

exports.down = (knex) => {
  return knex.schema.dropTableIfExists('refresh_tokens');
};