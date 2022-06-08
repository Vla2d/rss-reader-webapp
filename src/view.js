import onChange from 'on-change';

// View
const render = (state, elements, i18n) => {
  elements.addButton.textContent = i18n.t('buttons.add');
  elements.exampleText.textContent = i18n.t('content.example');
  elements.feedsTitle.textContent = i18n.t('content.feeds');
  elements.postsTitle.textContent = i18n.t('content.posts');
  elements.modalLink.textContent = i18n.t('modal.article');
  elements.modalClose.textContent = i18n.t('modal.close');

  const buildFeeds = (feeds, selectedElements) => {
    selectedElements.container.classList.remove('d-none');
    selectedElements.feeds.innerHTML = '';

    feeds.forEach((feed) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'list-group-item-dark');

      const feedTitle = document.createElement('h3');
      feedTitle.textContent = feed.title;
      const feedDescription = document.createElement('p');
      feedDescription.textContent = feed.description;
      li.append(feedTitle, feedDescription);

      selectedElements.feeds.append(li);
    });
  };

  const buildPosts = (posts, selectedElements, appState) => {
    selectedElements.posts.innerHTML = '';

    posts.forEach((post) => {
      const li = document.createElement('li');

      const isViewed = appState.readPostIds.includes(post.id);

      li.classList.add('list-group-item', 'list-group-item-dark', 'd-flex', 'justify-content-between');

      const postLinkText = document.createElement('a');
      postLinkText.classList.add(`${isViewed ? 'fw-normal' : 'fw-bold'}`);
      postLinkText.setAttribute('href', post.link);
      postLinkText.setAttribute('target', '_blank');
      postLinkText.dataset.id = post.id;
      postLinkText.textContent = post.title;

      const postButton = document.createElement('button');
      postButton.classList.add('btn', 'btn-primary', 'btn-sm');
      postButton.setAttribute('data-id', `${post.id}`);
      postButton.setAttribute('data-bs-toggle', 'modal');
      postButton.setAttribute('data-bs-target', '#modal');
      postButton.textContent = i18n.t('buttons.preview');
      li.append(postLinkText, postButton);

      selectedElements.posts.append(li);
    });
  };

  // Render feeds
  if (state.feeds.length > 0) {
    buildFeeds(state.feeds, elements);
    buildPosts(state.posts, elements, state);
  } else {
    elements.container.classList.add('d-none');
  }
};

// Utils
const handleViewPost = (post, selectedElements) => {
  selectedElements.modalTitle.textContent = post.title;
  selectedElements.modalContent.textContent = post.description;
  selectedElements.modalLink.href = post.link;
};

const handleLoadStatusState = (state, selectedElements, i18n) => {
  switch (state) {
    case 'loading':
      selectedElements.addButton.setAttribute('disabled', '');
      selectedElements.input.setAttribute('readonly', '');
      break;
    case 'idle':
      selectedElements.addButton.removeAttribute('disabled');
      selectedElements.input.removeAttribute('readonly');
      selectedElements.input.value = '';

      selectedElements.input.classList.add('is-valid');
      selectedElements.infoText.textContent = '';
      selectedElements.infoText.classList.remove('text-danger');
      selectedElements.infoText.classList.add('text-success');

      selectedElements.infoText.textContent = i18n.t('loadStatus.success');
      selectedElements.infoText.classList.remove('d-none');
      break;
    case 'failed':
      selectedElements.addButton.removeAttribute('disabled');
      selectedElements.input.removeAttribute('readonly');
      break;
    default:
      throw new Error(`Unexpected state: ${state}`);
  }
};

const handleLoadStatusError = (error, selectedElements, i18n) => {
  selectedElements.infoText.textContent = '';

  selectedElements.input.classList.remove('is-valid');
  selectedElements.input.classList.add('is-invalid');
  selectedElements.infoText.classList.remove('text-success');
  selectedElements.infoText.classList.add('text-danger');

  const handleErrorMessage = (errorType) => {
    switch (errorType) {
      case 'Parsing Error':
        return i18n.t('loadStatus.invalidRSS');
      case 'Network Error':
        return i18n.t('loadStatus.netError');
      default:
        throw new Error(`Unexpected error: ${errorType}`);
    }
  };

  selectedElements.infoText.textContent = handleErrorMessage(error);
  selectedElements.infoText.classList.remove('d-none');
};

const handleFormValidation = (state, selectedElements) => {
  switch (state) {
    case true:
      selectedElements.input.classList.remove('is-invalid');
      selectedElements.input.classList.add('is-valid');
      break;
    case false:
      selectedElements.input.classList.remove('is-valid');
      selectedElements.input.classList.add('is-invalid');
      break;
    default:
      throw new Error(`Unexpected state: ${state}`);
  }
};

const handleFormValidationError = (error, selectedElements) => {
  selectedElements.infoText.textContent = error;

  selectedElements.infoText.classList.remove('text-success');
  selectedElements.infoText.classList.add('text-danger');
  selectedElements.infoText.classList.remove('d-none');
};

// Watcher
const initView = (state, elements, i18n) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'modal.currentPost':
        handleViewPost(value, elements);
        break;
      case 'loadStatus.state':
        handleLoadStatusState(value, elements, i18n);
        break;
      case 'loadStatus.errorType':
        handleLoadStatusError(value, elements, i18n);
        break;
      case 'form.isValid':
        handleFormValidation(value, elements);
        break;
      case 'form.error':
        handleFormValidationError(value, elements, i18n);
        break;
      default:
        render(watchedState, elements, i18n);
        break;
    }
  });

  return watchedState;
};

export default initView;
