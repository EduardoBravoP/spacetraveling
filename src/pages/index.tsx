import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [isMorePost, setIsMorePost] = useState(
    postsPagination.next_page !== null
  );
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  async function handleFetchMorePosts() {
    const response = await fetch(postsPagination.next_page);
    const { results } = await response.json();

    setIsMorePost(!!results.next_page);

    const newPosts = results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>spacetraveling | Home</title>
      </Head>

      <div className={styles.container}>
        <Header />

        {posts.map(post => (
          <article className={styles.post} key={post.uid}>
            <a className={styles.title} href={`/post/${post.uid}`}>
              {post.data.title}
            </a>
            <p className={styles.subtitle}>{post.data.subtitle}</p>
            <div className={styles.infoContainer}>
              <div className={styles.infoGroup}>
                <FiCalendar size={20} />
                <p className={styles.info}>
                  {format(new Date(post.first_publication_date), 'PP', {
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div className={styles.infoGroup}>
                <FiUser size={20} />
                <p className={styles.info}>{post.data.author}</p>
              </div>
            </div>
          </article>
        ))}

        {isMorePost && (
          <button
            className={styles.button}
            type="button"
            onClick={handleFetchMorePosts}
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    { pageSize: 1, fetch: ['posts.title', 'posts.subtitle', 'posts.author'] }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
