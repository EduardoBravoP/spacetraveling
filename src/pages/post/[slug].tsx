import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));

    return total;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }
  return (
    <>
      <Header />
      <img
        src={post.data.banner.url}
        alt={post.data.title}
        className={styles.banner}
      />
      <div className={commonStyles.container}>
        <main>
          <h1 className={styles.title}>{post.data.title}</h1>
          <div className={commonStyles.infoContainer}>
            <div className={commonStyles.infoGroup}>
              <FiCalendar />
              <p className={commonStyles.info}>
                {format(new Date(post.first_publication_date), 'PP', {
                  locale: ptBR,
                })}
              </p>
            </div>

            <div className={commonStyles.infoGroup}>
              <FiUser />
              <p className={commonStyles.info}>{post.data.author}</p>
            </div>

            <div className={commonStyles.infoGroup}>
              <FiClock />
              <p className={commonStyles.info}>{readingTime} min</p>
            </div>
          </div>

          {post.data.content.map(content => (
            <div className={styles.content} key={content.heading}>
              <h2 className={styles.heading}>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    { pageSize: 10, fetch: [] }
  );

  return {
    paths: postsResponse.results.map(post => {
      return { params: { slug: post.uid } };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const group = response.data.content.map(content => {
    return {
      heading: content.heading,
      body: [...content.body],
    };
  });

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: group,
    },
  };

  return {
    props: {
      post,
    },
  };
};
