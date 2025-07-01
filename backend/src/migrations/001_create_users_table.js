exports.up = async (knex) => {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create users table
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).unique().notNullable().index();
    table.string('username', 100).unique().notNullable().index();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 255);
    table.text('profile_picture_url');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.string('role', 50).defaultTo('user');
    table.jsonb('preferences').defaultTo('{}');
    table.timestamp('last_login_at');
    table.timestamps(true, true);

    // Indexes
    table.index('created_at');
    table.index(['is_active', 'email_verified']);
  });
};

exports.down = (knex) => {
  return knex.schema.dropTableIfExists('users');
};