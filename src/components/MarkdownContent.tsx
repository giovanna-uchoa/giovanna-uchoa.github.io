import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { getContentPalette, monoFont } from '../theme/muiTheme';

interface MarkdownContentProps {
  content: string;
}

function MarkdownContent({ content }: MarkdownContentProps) {
  const theme = useTheme();
  const contentPalette = getContentPalette(theme.palette.mode);

  return (
    <Box
      sx={{
        width: '100%',
        minWidth: 0,
        overflowX: 'hidden',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',

        '& pre': {
          maxWidth: '100%',
          overflowX: 'auto',
          backgroundColor: contentPalette.markdownCodeBackground,
          color: contentPalette.markdownCodeText,
          borderRadius: '0.5rem',
          p: 2,
          overflow: 'auto',
          mb: 1.5,
        },

        '& pre code': {
          backgroundColor: 'transparent',
          color: 'inherit',
          p: 0,
        },

        '& ul, & ol': {
          pl: 2,
          mb: 1.5,
        },
        
        '& li': {
          mb: 0.5,
        },

        '& blockquote': {
          margin: '0 0 1rem',
          padding: '0.35rem 0.9rem',
          borderLeft: `3px solid ${contentPalette.markdownBlockquoteBorder}`,
          backgroundColor: contentPalette.markdownBlockquoteBackground,
          borderRadius: '0.35rem',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
            h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <Typography variant="h5" sx={{ mt: 3, mb: 1.5, color: theme.palette.primary.main }} {...props}>
                {props.children}
            </Typography>
            ),
            h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <Typography variant="h6" sx={{ mt: 2.5, mb: 1 }} {...props}>
                {props.children}
            </Typography>
            ),
            p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
            <Typography sx={{ mb: 1.5, lineHeight: 1.6 }} {...props}>
                {props.children}
            </Typography>
            ),
            code: (props: React.HTMLAttributes<HTMLElement>) => (
            <Box
                component="code"
                sx={{
                  px: 0.5,
                  py: 0.25,
                  borderRadius: '4px',
                  fontFamily: monoFont,
                  backgroundColor: contentPalette.markdownCodeBackground,
                  color: contentPalette.markdownCodeText,
                }}
                {...props}
            >
                {props.children}
            </Box>
            ),
            a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
            <Link
                href={props.href}
                target={props.href?.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                sx={{
                  color: theme.palette.secondary.main,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
                {...props}
            >
                {props.children}
            </Link>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}

export default MarkdownContent;