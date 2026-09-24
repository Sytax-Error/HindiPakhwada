# Facebook Public Posts Module Document

## 1. Purpose

This module manages the public-facing Facebook post feed used on the website. It is designed for official public Facebook post URLs that can be embedded on the site and displayed in a clean, responsive timeline feed.

The module supports two main surfaces:

- Public social feed page: visitors browse approved Facebook posts in a scrolling feed
- Admin social post management page: authenticated admins add, edit, enable, disable, and remove public posts

## 2. Scope

### In scope

- Public Facebook post URLs managed as records in the database
- Single feed layout with a Facebook-like scroll experience
- Responsive card layout for posts on desktop and mobile
- Admin CRUD for social post entries
- Ordering and activation control for public posts
- Safe handling of embed URLs and validation rules

### Out of scope

- Support for Instagram, X, YouTube, or LinkedIn in the same module unless explicitly extended later
- Auto-importing posts from Facebook API
- Live sync from Facebook pages or admin dashboards
- User accounts or comments on embedded posts
- Full-text extraction or text parsing from embedded content

## 3. User Roles

| Role | Access |
|---|---|
| Visitor | View public Facebook feed |
| Admin | Create, edit, publish, hide, and remove Facebook posts |

## 4. Functional Requirements

### 4.1 Social post model

Each social post record stores:

- `id`: unique database identifier
- `platform`: fixed value, currently `facebook`
- `url`: public Facebook post URL
- `title`: optional short label or title for the post
- `status`: `draft`, `published`, or `archived`
- `sortOrder`: numeric ordering value for visual feed order
- `publishedAt`: date when the post should be displayed publicly
- `isActive`: soft-enabled flag for public rendering
- `createdBy`: admin user reference
- `createdAt`: record creation timestamp
- `updatedAt`: last update timestamp

### 4.2 URL rules

- Only valid public post URLs are accepted
- A post URL must point to a specific Facebook post, not the page homepage
- Examples of acceptable formats:
  - `https://www.facebook.com/username/posts/1234567890123456`
  - `https://www.facebook.com/MeitY.NICSI/posts/pfbid...`
- Homepage/profile URLs such as `https://www.facebook.com/MeitY.NICSI/` are not recommended for this module and should be rejected or flagged as not embeddable

### 4.3 Admin social post workflow

1. Admin opens `/admin/social-posts`.
2. Admin enters a Facebook post URL and optional title.
3. Admin chooses a publish status and display order.
4. Admin saves the post.
5. The record is stored in the database and appears in the public feed if `status = published` and `isActive = true`.
6. Admin can edit the URL, order, or status.
7. Admin can hide or delete a post without losing its historical record.

### 4.4 Public social feed workflow

1. Public visitors open the social feed page.
2. The frontend fetches only published active posts.
3. Posts are sorted by `sortOrder` and then by `publishedAt` descending.
4. Posts render in a single scrolling feed.
5. Each post uses the same content width and spacing so the feed looks uniform.
6. Native Facebook embedded behavior remains in control of the iframe; app code must not override or hijack its internal links.

## 5. Business Rules

- A post must include a valid public Facebook URL.
- Duplicate URLs must be prevented.
- Only published and active posts are displayed in the public feed.
- The feed must remain stable even if some posts fail to render due to Facebook embed restrictions.
- The app should never force navigation inside the site from a Facebook embed action.
- If Facebook blocks a specific post from embedding, the record can remain stored but may render as an empty or restricted box in the browser without breaking the rest of the feed.
- The URL must be normalized before save.

## 6. API Contracts

### Public API

- `GET /api/social-posts`
  - Returns published active social posts for the public feed
  - Response example:

```json
{
  "posts": [
    {
      "_id": "64f...",
      "platform": "facebook",
      "url": "https://www.facebook.com/MeitY.NICSI/posts/....",
      "title": "NICSI Event",
      "publishedAt": "2026-09-10T12:00:00.000Z",
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

### Admin API

- `GET /api/admin/social-posts`
  - Lists all social posts for admin management
- `POST /api/admin/social-posts`
  - Creates a social post
- `PUT /api/admin/social-posts/:id`
  - Updates an existing social post
- `DELETE /api/admin/social-posts/:id`
  - Deletes a social post record

## 7. Data Model Notes

### Recommended Mongo schema

```js
{
  platform: { type: String, enum: ['facebook'], default: 'facebook' },
  url: { type: String, required: true, trim: true },
  title: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  sortOrder: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## 8. Frontend Rendering Rules

### Feed layout

- The public feed should render as a single-column vertical timeline
- Each post should sit inside a full-width content shell
- Embed width must be uniform across all posts
- The feed should keep consistent card spacing and rounded corners
- On mobile screens, posts should resize proportionally without breaking layout

### Rendering component

Use a reusable component such as:

```jsx
<SocialPostFeed posts={posts} />
```

Each entry renders:

- optional title/header
- `FacebookEmbed` or equivalent component
- consistent wrapper width
- native Facebook behavior preserved

## 9. Important Integration Notes

- This module uses the library `react-social-media-embed` for Facebook embeds
- Do not override the internal native “See more” behavior inside the embed iframe unless absolutely needed
- If clicked links within the iframe attempt navigation, prefer letting Facebook handle them or opening in a new tab as a fallback
- The module should prioritize browser-safe rendering over custom reimplementation of Facebook content behavior

## 10. Acceptance Criteria

- Admin can add one or more valid public Facebook post URLs
- Public feed displays only published and active posts
- Posts appear in a consistent, responsive, feed-style layout
- Duplicate or invalid URLs are rejected
- Posts can be reordered, hidden, or unpublished without deleting the record
- The app remains stable when a specific Facebook post is blocked or non-embeddable

## 11. Recommended Implementation Order

1. Create the `SocialPost` model
2. Add backend routes for public and admin access
3. Build admin page to manage posts
4. Replace static embed links with API-loaded posts
5. Build the responsive public feed layout
6. Validate final rendering on desktop and mobile
7. Move the implementation from the test page into the correct production route

## 12. Implementation Notes

- Prefer a dedicated `social-posts` collection instead of storing post data inside global settings
- Keep post records as reusable content rather than tying them to a single page component
- Use the final public route for live content and reserve `/social-embed-test` only for testing and validation
- Keep the embed logic deterministic and avoid custom overrides of the native Facebook iframe behavior unless required by app-level UX rules
