import { Localized } from 'fluent-react/compat';
const pick = require('lodash.pick');
import * as React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';
import { NavLink } from 'react-router-dom';
import { UserClient } from 'common/user-clients';
import { User } from '../../../stores/user';
import StateTree from '../../../stores/tree';
import URLS from '../../../urls';
import { localeConnector, LocalePropsFromState } from '../../locale-helpers';
import {
  BarChartIcon,
  CameraIcon,
  CogIcon,
  TrashIcon,
  UserIcon,
  UserPlusIcon,
} from '../../ui/icons';
import { Button } from '../../ui/ui';
import AvatarSetup from './avatar-setup/avatar-setup';
import DeleteProfile from './delete/delete';
import Goals from './goals/goals';
import InfoPage from './info/info';
import Settings from './settings/settings';

import './layout.css';

function downloadData(account: UserClient) {
  const text = [
    ...Object.entries(pick(account, 'email', 'username', 'age', 'gender')),
    ...account.locales.reduce((all, l, i) => {
      const localeLabel = 'language ' + (i + 1);
      return [
        ...all,
        [localeLabel, l.locale],
        [localeLabel + ' accent', l.accent],
      ];
    }, []),
  ]
    .map(([key, value]) => key + ': ' + value)
    .join('\n');

  const element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
  );
  element.setAttribute('download', 'profile.txt');

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

interface PropsFromState {
  user: User.State;
}

interface Props extends LocalePropsFromState, PropsFromState {}

const Layout = ({ toLocaleRoute, user }: Props) => {
  const [infoRoute, avatarRoute, goalsRoute, prefRoute, deleteRoute] = [
    URLS.PROFILE_INFO,
    URLS.PROFILE_AVATAR,
    URLS.PROFILE_GOALS,
    URLS.PROFILE_SETTINGS,
    URLS.PROFILE_DELETE,
  ].map(r => toLocaleRoute(r));
  return (
    <div className="profile-layout">
      <div className="profile-nav">
        <div className="links">
          {[
            {
              route: infoRoute,
              ...(user.account
                ? { icon: <UserIcon />, id: 'profile' }
                : { icon: <UserPlusIcon />, id: 'build-profile' }),
            },
            { route: avatarRoute, icon: <CameraIcon />, id: 'avatar' },
            { route: goalsRoute, icon: <BarChartIcon />, id: 'goals' },
            { route: prefRoute, icon: <CogIcon />, id: 'settings' },
            {
              route: deleteRoute,
              icon: <TrashIcon />,
              id: 'profile-form-delete',
            },
          ].map(({ route, icon, id }) => (
            <NavLink key={route} to={route}>
              {icon}
              <Localized id={id}>
                <span className="text" />
              </Localized>
            </NavLink>
          ))}
        </div>

        {user.account && (
          <div className="buttons">
            <Localized id="download-profile">
              <Button
                rounded
                outline
                onClick={() => downloadData(user.account)}
              />
            </Localized>
          </div>
        )}
      </div>
      <div className="content">
        <Switch>
          <Route exact path={infoRoute} component={InfoPage} />
          {[
            { route: avatarRoute, Component: AvatarSetup },
            { route: goalsRoute, Component: Goals },
            { route: prefRoute, Component: Settings },
            { route: deleteRoute, Component: DeleteProfile },
          ].map(({ route, Component }) => (
            <Route
              key={route}
              exact
              path={route}
              render={props =>
                user.account ? <Component /> : <Redirect to={infoRoute} />
              }
            />
          ))}
          <Route
            render={() => <Redirect to={toLocaleRoute(URLS.PROFILE_INFO)} />}
          />
        </Switch>
      </div>
    </div>
  );
};
export default connect<PropsFromState>(({ user }: StateTree) => ({ user }))(
  localeConnector(Layout)
);
