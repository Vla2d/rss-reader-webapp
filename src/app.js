import 'bootstrap';
import axios from 'axios';
import { uniqueId, union, differenceBy } from 'lodash';
import i18next from 'i18next';
import * as yup from 'yup';
import ru from './locales/ru.js';
import initView from './view.js';

// Utils
// Parser
const parseRSS = (content) => {
  const doc = new DOMParser().parseFromString(content, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const error = new Error('Parsing error');
    error.isParsingError = true;
    throw error;
  }

  const title = doc.querySelector('title').textContent;
  const description = doc.querySelector('description').textContent;

  const feed = {
    title, description,
  };

  const items = [...doc.querySelectorAll('item')]
    .map((item) => {
      const postTitle = item.querySelector('title').textContent;
      const postDescription = item.querySelector('description').textContent;
      const postLink = item.querySelector('link').textContent;

      const data = {
        title: postTitle, description: postDescription, link: postLink,
      };

      return data;
    });

  return { feed, items };
};

// Validator
const validateLink = (link, urls, i18n) => {
  const schema = yup.string()
    .url(i18n.t('loadStatus.invalidUrl'))
    .notOneOf(urls, i18n.t('loadStatus.sameUrl'));

  return schema.validate(link);
};

// Loader
const buildProxyUrl = (originalLink) => {
  const url = new URL('https://allorigins.hexlet.app/get');
  url.searchParams.set('disableCache', 'true');
  url.searchParams.set('url', originalLink);

  return url;
};
const fetchRSS = (link) => axios.get(buildProxyUrl(link));

// Error handler
const getErrorType = (error) => {
  if (error.isParsingError) {
    return 'Parsing Error';
  } if (error.isAxiosError) {
    return 'Network Error';
  }
  return 'Unknown Error';
};

// Controllers
// Add feed
const handleAddFeed = (state, link) => {
  state.loadStatus.state = 'loading';

  fetchRSS(link)
    .then((res) => parseRSS(res.data.contents))
    .then((res) => {
      const { feed, items } = res;

      feed.url = link;
      state.feeds.unshift(feed);

      const newPosts = items.map((post) => {
        post.id = uniqueId();
        return post;
      });
      state.posts = [...newPosts, ...state.posts];

      state.loadStatus.state = 'idle';
    })
    .catch((err) => {
      state.loadStatus.state = 'failed';
      state.loadStatus.errorType = getErrorType(err);
    });
};

// Updater
const updateRSS = (state, timeout = 5000) => {
  const requests = state.feeds.map((feed) => fetchRSS(feed.url)
    .catch((err) => {
      console.error(err);
    })
    .then((res) => {
      const { items } = parseRSS(res.data.contents);

      const allPosts = union(items, state.posts);
      const newPosts = differenceBy(allPosts, state.posts, 'link')
        .map((post) => {
          post.id = uniqueId();
          return post;
        });
      if (newPosts.length > 0) {
        state.posts = [...newPosts, ...state.posts];
      }
    }));

  Promise.all(requests)
    .finally(() => {
      setTimeout(() => updateRSS(state), timeout);
    });
};

// Read post
const handleReadPost = (state, postId) => {
  if (!state.readPostIds.includes(postId)) {
    state.readPostIds.push(postId);
  }
};

// Model
const app = () => {
  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('#url_input'),
    infoText: document.querySelector('#info_text'),
    addButton: document.querySelector('#add_button'),
    feeds: document.querySelector('#feeds_list'),
    posts: document.querySelector('#posts_list'),
    feedsTitle: document.querySelector('#feeds_title'),
    postsTitle: document.querySelector('#posts_title'),
    exampleText: document.querySelector('#example_text'),

    container: document.querySelector('#main_container'),

    modalTitle: document.querySelector('#modal_title'),
    modalContent: document.querySelector('#modal_body'),
    modalLink: document.querySelector('#modal_link'),
    modalClose: document.querySelector('#modal_close'),
  };

  const state = {
    feeds: [],
    posts: [],
    form: {
      state: 'filling',
      isValid: true, // true, false
      error: null,
    },
    loadStatus: {
      state: 'idle', // idle, loading, failed
      errorType: null,
    },
    readPostIds: [],
    modal: { currentPost: null },
  };

  const i18nInstance = i18next.createInstance();
  return i18nInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  }).then(() => {
    const watchedState = initView(state, elements, i18nInstance);

    const { form } = elements;
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const link = new FormData(e.target).get('url').trim();
      const existedUrls = watchedState.feeds.map((feed) => feed.url);
      validateLink(link, existedUrls, i18nInstance)
        .then(() => {
          watchedState.form.isValid = true;
          watchedState.form.error = null;
          handleAddFeed(watchedState, link);
        })
        .catch((err) => {
          watchedState.form.isValid = false;
          watchedState.form.error = err.message;
        });
    });

    const postsUl = elements.posts;

    postsUl.addEventListener('click', (event) => {
      const { target } = event;

      const currentPostId = target.getAttribute('data-id');
      if (!currentPostId) {
        return;
      }

      watchedState.modal.currentPost = watchedState.posts.find((el) => el.id === currentPostId);
      handleReadPost(watchedState, currentPostId);
    });
    updateRSS(watchedState);
  });
};

export default app;
