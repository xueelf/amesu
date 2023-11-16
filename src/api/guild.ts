import type { Data, Request, Result } from '@/client/request';
import type { Guild } from '@/model/guild';
import type { Member, Role } from '@/model/member';
import type { Channel, ChannelSubType, ChannelType, PrivateType, SpeakPermission } from '@/model/channel';

export interface GuildChannelData extends Data {
  /** 子频道名称 */
  name: string;
  /** 子频道类型 */
  type: ChannelType;
  /** 子频道子类型 */
  sub_type: ChannelSubType;
  /** 子频道排序，必填；当子频道类型为 子频道分组（ChannelType=4）时，必须大于等于 2 */
  position: number;
  /** 子频道所属分组ID */
  parent_id: string;
  /** 子频道私密类型 */
  private_type: PrivateType;
  /** 子频道私密类型成员 ID */
  private_user_ids: string[];
  /** 子频道发言权限 */
  speak_permission: SpeakPermission;
  /** 应用类型子频道应用 AppID，仅应用子频道需要该字段 */
  application_id: string;
}

export interface GuildRoleMembers {
  data: Member[];
  next: string;
}

export interface DeleteGuildUserMemberData extends Data {
  /** 删除成员的同时，将该用户添加到频道黑名单中 */
  add_blacklist: boolean;
  /** 删除成员的同时，撤回该成员的消息，可以指定撤回消息的时间范围 */
  delete_history_msg_days: number;
}

export interface GuildRoles {
  /** 频道 ID */
  guild_id: string;
  /** 一组频道身份组对象 */
  roles: Role[];
  /** 默认分组上限 */
  role_num_limit: string;
}

export interface GuildRolesData extends Data {
  /** 名称 */
  name?: string;
  /** ARGB 的 HEX 十六进制颜色值转换后的十进制数值 */
  color?: number;
  /** 在成员列表中单独展示: 0-否, 1-是 */
  hoist?: number;
}

export interface CreateGuildRoles {
  /** 身份组 ID */
  role_id: string;
  /** 所创建的频道身份组对象 */
  role: Role[];
}

export interface UpdateGuildRoles {
  /** 频道 ID */
  guild_id: string;
  /** 身份组 ID */
  role_id: string;
  /** 所创建的频道身份组对象 */
  role: Role[];
}

export interface AddGuildMemberRolesData extends Data {
  channel: Channel;
}

export default (request: Request) => {
  return {
    /**
     * 获取 `guild_id` 指定的频道的详情。
     */
    getGuildInfo(guild_id: string): Promise<Result<Guild>> {
      return request.get<Guild>(`/guilds/${guild_id}`);
    },

    /**
     * 获取 guild_id 指定的频道下的子频道列表。
     */
    getGuildChannels(guild_id: string): Promise<Result<Channel[]>> {
      return request.get<Channel[]>(`/guilds/${guild_id}/channels`);
    },

    /**
     * 在 guild_id 指定的频道下创建一个子频道。
     */
    createGuildChannel(guild_id: string, data: GuildChannelData): Promise<Result<Channel>> {
      return request.post<Channel>(`/guilds/${guild_id}/channels`, data);
    },

    /**
     * 获取 guild_id 指定的频道中所有成员的详情列表，支持分页。
     */
    getGuildMembers(guild_id: string, after: string = '0', limit: number = 1): Promise<Result<Member[]>> {
      return request.get<Member[]>(`/guilds/${guild_id}/members?after=${after}&limit=${limit}`);
    },

    /**
     * 获取 guild_id 频道中指定 role_id 身份组下所有成员的详情列表，支持分页。
     */
    getGuildRoleMembers(
      guild_id: string,
      role_id: string,
      start_index: string = '0',
      limit: number = 1,
    ): Promise<Result<GuildRoleMembers>> {
      return request.get<GuildRoleMembers>(
        `/guilds/${guild_id}/roles/${role_id}/members?start_index=${start_index}&limit=${limit}`,
      );
    },

    /**
     * 获取 guild_id 指定的频道中 user_id 对应成员的详细信息。
     */
    getGuildUserMember(guild_id: string, user_id: string): Promise<Result<Member>> {
      return request.get<Member>(`/guilds/${guild_id}/members/${user_id}`);
    },

    /**
     * 删除 guild_id 指定的频道下的成员 user_id。
     */
    deleteGuildUserMember(guild_id: string, user_id: string, data: DeleteGuildUserMemberData): Promise<Result> {
      return request.delete(`/guilds/${guild_id}/members/${user_id}`, data);
    },

    /**
     * 获取 guild_id 指定的频道下的身份组列表。
     */
    getGuildRoles(guild_id: string): Promise<Result<GuildRoles>> {
      return request.get<GuildRoles>(`/guilds/${guild_id}/roles`);
    },

    /**
     * 在 guild_id 指定的频道下创建一个身份组。
     */
    createGuildRoles(guild_id: string, data: GuildRolesData): Promise<Result<CreateGuildRoles>> {
      return request.post<CreateGuildRoles>(`/guilds/${guild_id}/roles`, data);
    },

    /**
     * 修改频道 guild_id 下 role_id 指定的身份组。
     */
    updateGuildRoles(guild_id: string, role_id: string, data: GuildRolesData): Promise<Result<UpdateGuildRoles>> {
      return request.patch<UpdateGuildRoles>(`/guilds/${guild_id}/roles/${role_id}`, data);
    },

    /**
     * 删除频道 guild_id下 role_id 对应的身份组。
     */
    deleteGuildRoles(guild_id: string, role_id: string): Promise<Result> {
      return request.delete(`/guilds/${guild_id}/roles/${role_id}`);
    },

    /**
     * 将频道 guild_id 下的用户 user_id 添加到身份组 role_id 。
     */
    addGuildMemberRoles(
      guild_id: string,
      user_id: string,
      role_id: string,
      data: AddGuildMemberRolesData,
    ): Promise<Result> {
      return request.put(`/guilds/${guild_id}/members/${user_id}/roles/${role_id}`, data);
    },

    /**
     * 将用户 user_id 从 频道 guild_id 的 role_id 身份组中移除。
     */
    deleteGuildMemberRoles(
      guild_id: string,
      user_id: string,
      role_id: string,
      data: AddGuildMemberRolesData,
    ): Promise<Result> {
      return request.delete(`/guilds/${guild_id}/members/${user_id}/roles/${role_id}`, data);
    },
  };
};
