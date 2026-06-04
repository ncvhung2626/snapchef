/** Stitch UI screen IDs — DESIGN.md */
export const STITCH_SCREEN_IDS = {
  welcome: 'f3910eac15414fc6b4efb01baad36e7b',
  login: '24540a46c9ff446598d0d498ab9a8951',
  home: '6f41e49cc70f4ec0a989c654aa52d8c0',
  reels: 'af3f0b123a32432dbe47dcc983cd6e45',
  createPost: '63430163bf6947309d37bbdda0c90f09',
  inbox: '3679e8306d144b6cb39de2a631e9db55',
  profile: '29c2dfd11d8d418f905c232a1ede36ec',
  postDetail: '06d14baaec1d49399e55756df6bdac32',
  comments: '8e6f1aaea82c493ea322a9d593dbc730',
  createGroup: 'ee2de73afccb4069841a813a18470384',
  groupDetail: '08436d09bf2a4a348d9c09e3ad694f02',
  postManagement: 'c170d7413dcb4ae5ba00f13069039a40',
  memberManagement: '6188bfbac0484a8681e75f4c0dd89a22',
} as const;

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';
