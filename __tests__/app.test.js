import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { promises as fs } from 'fs';
import path from 'path';
import app from '../src/app.js';

beforeEach(async () => {
  const pathToHtml = path.join(__dirname, '../index.html');
  const html = await fs.readFile(pathToHtml, 'utf-8');
  document.body.innerHTML = html;
  await app();
});

test('adding', async () => {
  const rssUrl = 'https://ru.hexlet.io/lessons.rss';

  await userEvent.type(screen.getByRole('textbox', { name: 'url' }), rssUrl);
  await userEvent.click(screen.getByRole('button', { name: 'add' }));

  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
});

test('validation (uniqueness)', async () => {
  const rssUrl = 'https://ru.hexlet.io/lessons.rss';
  userEvent.type(screen.getByRole('textbox', { name: 'url' }), rssUrl);
  userEvent.click(screen.getByRole('button', { name: 'add' }));

  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();

  userEvent.type(screen.getByRole('textbox', { name: 'url' }), rssUrl);
  userEvent.click(screen.getByRole('button', { name: 'add' }));

  expect(await screen.findByText(/RSS уже существует/i)).toBeInTheDocument();
});

test('validation (unvalid url)', async () => {
  await userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: 'add' }));
  expect(await screen.findByText(/Ссылка должна быть валидным URL/i)).toBeInTheDocument();
});

test('handling non-rss url', async () => {
  const htmlUrl = 'https://ru.hexlet.io';
  await userEvent.type(screen.getByRole('textbox', { name: 'url' }), htmlUrl);
  await userEvent.click(screen.getByRole('button', { name: 'add' }));

  expect(await screen.findByText(/Ресурс не содержит валидный RSS/i)).toBeInTheDocument();
});
