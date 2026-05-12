import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register a clean, premium serif font for titles
Font.register({
  family: 'Georgia',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/eb-garamond@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/eb-garamond@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

// Clean sans-serif for body text
Font.register({
  family: 'OpenSans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-600-normal.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

const CREAM = '#FFF8F0';
const AMBER_DARK = '#92400E';
const AMBER_MED = '#B45309';
const AMBER_LIGHT = '#D97706';
const GOLD = '#F59E0B';
const WHITE = '#FFFFFF';
const GRAY = '#6B7280';

const styles = StyleSheet.create({
  // ─── Cover page ───────────────────────────────────────────
  coverPage: {
    backgroundColor: CREAM,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    position: 'relative',
  },
  coverImageContainer: {
    width: 420,
    height: 420,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    border: `6px solid ${WHITE}`,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverTitle: {
    fontFamily: 'Georgia',
    fontSize: 38,
    fontWeight: 700,
    color: AMBER_DARK,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 1.2,
    maxWidth: 550,
  },
  coverDescription: {
    fontFamily: 'OpenSans',
    fontSize: 14,
    color: AMBER_MED,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 450,
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  coverAuthor: {
    fontFamily: 'OpenSans',
    fontSize: 16,
    fontWeight: 600,
    color: AMBER_LIGHT,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  coverBadge: {
    fontFamily: 'OpenSans',
    fontSize: 11,
    color: GRAY,
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  coverDivider: {
    width: 80,
    height: 2,
    backgroundColor: GOLD,
    marginVertical: 16,
    borderRadius: 1,
  },

  // ─── Story pages ──────────────────────────────────────────
  storyPage: {
    backgroundColor: CREAM,
    flexDirection: 'column',
    padding: 0,
    position: 'relative',
  },
  storyImageContainer: {
    width: '100%',
    height: '58%',
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  storyTextContainer: {
    flex: 1,
    paddingHorizontal: 60,
    paddingTop: 24,
    paddingBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyText: {
    fontFamily: 'OpenSans',
    fontSize: 20,
    color: AMBER_DARK,
    textAlign: 'center',
    lineHeight: 1.7,
    maxWidth: 580,
  },
  pageNumber: {
    fontFamily: 'OpenSans',
    fontSize: 11,
    color: AMBER_LIGHT,
    position: 'absolute',
    bottom: 22,
    right: 40,
  },

  // ─── End page ─────────────────────────────────────────────
  endPage: {
    backgroundColor: CREAM,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    position: 'relative',
  },
  endEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  endTitle: {
    fontFamily: 'Georgia',
    fontSize: 42,
    fontWeight: 700,
    color: AMBER_DARK,
    textAlign: 'center',
    marginBottom: 20,
  },
  endAuthor: {
    fontFamily: 'OpenSans',
    fontSize: 18,
    fontWeight: 600,
    color: AMBER_MED,
    textAlign: 'center',
    marginBottom: 6,
  },
  endStoryTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: 700,
    color: AMBER_DARK,
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  endDivider: {
    width: 60,
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 24,
    borderRadius: 1,
  },
  endBranding: {
    fontFamily: 'OpenSans',
    fontSize: 13,
    color: GRAY,
    textAlign: 'center',
    lineHeight: 1.6,
  },

  // ─── Footer (all pages) ───────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'OpenSans',
    fontSize: 9,
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
});

interface PageData {
  page_number: number;
  text: string;
  image_path: string | null;
}

interface StoryPDFProps {
  title: string;
  description?: string;
  cover_image?: string;
  author_name?: string;
  author_credit?: string;
  age_range?: string;
  categoryName?: string;
  categoryEmoji?: string;
  pages: PageData[];
}

function getAuthorLabel(credit?: string): string {
  if (credit === 'authored') return 'Written by';
  if (credit === 'coauthored') return 'Co-authored by';
  return 'Imagined by';
}

const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>storysparks.fun</Text>
  </View>
);

export function StoryPDF({
  title,
  description,
  cover_image,
  author_name,
  author_credit,
  age_range,
  categoryName,
  pages,
}: StoryPDFProps) {
  return (
    <Document
      title={title}
      author={author_name || 'Story Sparks'}
      subject={description || `A Story Sparks storybook`}
      creator="Story Sparks — storysparks.fun"
    >
      {/* ── Cover page ── */}
      <Page size="LETTER" orientation="landscape" style={styles.coverPage}>
        {cover_image && (
          <View style={styles.coverImageContainer}>
            <Image src={cover_image} style={styles.coverImage} />
          </View>
        )}
        <Text style={styles.coverTitle}>{title}</Text>
        {description && (
          <Text style={styles.coverDescription}>{description}</Text>
        )}
        {author_name && (
          <>
            <View style={styles.coverDivider} />
            <Text style={styles.coverAuthor}>
              {getAuthorLabel(author_credit)} {author_name}
            </Text>
          </>
        )}
        <View style={styles.coverMeta}>
          {categoryName && (
            <Text style={styles.coverBadge}>{categoryName}</Text>
          )}
          {age_range && (
            <Text style={styles.coverBadge}>Ages {age_range}</Text>
          )}
          <Text style={styles.coverBadge}>{pages.length} pages</Text>
        </View>
        <Footer />
      </Page>

      {/* ── Story pages ── */}
      {pages.map((p, i) => (
        <Page key={i} size="LETTER" orientation="landscape" style={styles.storyPage}>
          {p.image_path && (
            <View style={styles.storyImageContainer}>
              <Image src={p.image_path} style={styles.storyImage} />
            </View>
          )}
          <View style={styles.storyTextContainer}>
            <Text style={styles.storyText}>{p.text}</Text>
          </View>
          <Text style={styles.pageNumber}>{i + 1}</Text>
          <Footer />
        </Page>
      ))}

      {/* ── End page ── */}
      <Page size="LETTER" orientation="landscape" style={styles.endPage}>
        <Text style={styles.endEmoji}>✨</Text>
        <Text style={styles.endTitle}>The End</Text>
        <Text style={styles.endStoryTitle}>{title}</Text>
        {author_name && (
          <Text style={styles.endAuthor}>
            {getAuthorLabel(author_credit)} {author_name}
          </Text>
        )}
        <View style={styles.endDivider} />
        <Text style={styles.endBranding}>
          Made with love on Story Sparks{'\n'}
          Every kid has a spark — we turn it into a story
        </Text>
        <Footer />
      </Page>
    </Document>
  );
}
